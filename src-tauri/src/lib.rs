#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use printpdf::{
    path::PaintMode, Color, Greyscale, IndirectFontRef, Line, Mm, PdfDocument as NativePdfDocument,
    PdfDocumentReference, PdfLayerReference, Point, Polygon, Rgb,
};
use serde::Deserialize;
use std::fs;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const PAGE_WIDTH: f64 = 210.0;
const PAGE_HEIGHT: f64 = 297.0;
const MARGIN_X: f64 = 22.0;
const MARGIN_TOP: f64 = 270.0;
const MARGIN_BOTTOM: f64 = 21.0;
const CONTENT_WIDTH: f64 = PAGE_WIDTH - (MARGIN_X * 2.0);
const GEIST_FONT: &[u8] = include_bytes!("../assets/Geist-Regular.ttf");

fn workspace_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join("workspace.json"))
}

#[tauri::command]
fn load_native_workspace(app: AppHandle) -> Result<Option<String>, String> {
    let path = workspace_path(&app)?;
    match fs::read_to_string(path) {
        Ok(value) => Ok(Some(value)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn save_native_workspace(app: AppHandle, payload: String) -> Result<(), String> {
    let path = workspace_path(&app)?;
    let temporary = path.with_extension("json.tmp");
    fs::write(&temporary, payload).map_err(|error| error.to_string())?;
    fs::rename(temporary, path).map_err(|error| error.to_string())
}

#[derive(Deserialize, Clone)]
struct PdfMark {
    #[serde(rename = "type")]
    kind: String,
    #[serde(default)]
    color: Option<String>,
}

#[derive(Deserialize, Clone)]
struct PdfInline {
    text: String,
    #[serde(default)]
    marks: Vec<PdfMark>,
}

#[derive(Deserialize)]
struct PdfBlock {
    text: String,
    #[serde(default)]
    r#type: String,
    #[serde(default)]
    content: Vec<PdfInline>,
    #[serde(default)]
    checked: bool,
    #[serde(default)]
    collapsed: bool,
}

#[derive(Deserialize)]
struct PdfDocument {
    title: String,
    blocks: Vec<PdfBlock>,
}

#[derive(Clone)]
struct PdfRun {
    text: String,
    marks: Vec<PdfMark>,
}

struct PdfCanvas {
    document: PdfDocumentReference,
    page: printpdf::PdfPageIndex,
    layer: printpdf::PdfLayerIndex,
    y: f64,
    font: IndirectFontRef,
}

impl PdfCanvas {
    fn new(
        document: PdfDocumentReference,
        page: printpdf::PdfPageIndex,
        layer: printpdf::PdfLayerIndex,
        font: IndirectFontRef,
    ) -> Self {
        Self {
            document,
            page,
            layer,
            y: MARGIN_TOP,
            font,
        }
    }

    fn layer(&self) -> PdfLayerReference {
        self.document.get_page(self.page).get_layer(self.layer)
    }

    fn new_page(&mut self) {
        let added = self
            .document
            .add_page(Mm(PAGE_WIDTH as f32), Mm(PAGE_HEIGHT as f32), "Grapho");
        self.page = added.0;
        self.layer = added.1;
        self.y = MARGIN_TOP;
    }

    fn ensure_space(&mut self, height: f64) {
        if self.y - height < MARGIN_BOTTOM {
            self.new_page();
        }
    }

    fn advance(&mut self, height: f64) {
        self.y -= height;
    }
}

fn text_width_mm(text: &str, size: f64) -> f64 {
    text.chars().count() as f64 * size * 0.19
}

fn max_chars(width: f64, size: f64) -> usize {
    (width / (size * 0.19)).floor().max(1.0) as usize
}

fn wrap_text(text: &str, width: f64, size: f64) -> Vec<String> {
    let limit = max_chars(width, size);
    let mut lines = Vec::new();
    for hard_line in text.replace('\r', "").split('\n') {
        let mut current = String::new();
        for word in hard_line.split_whitespace() {
            if word.chars().count() > limit {
                if !current.is_empty() {
                    lines.push(current.trim_end().to_string());
                    current.clear();
                }
                let chars: Vec<char> = word.chars().collect();
                for chunk in chars.chunks(limit) {
                    lines.push(chunk.iter().collect());
                }
                continue;
            }
            let candidate = if current.is_empty() {
                word.to_string()
            } else {
                format!("{} {}", current, word)
            };
            if candidate.chars().count() > limit && !current.is_empty() {
                lines.push(current.trim_end().to_string());
                current = word.to_string();
            } else {
                current = candidate;
            }
        }
        if !current.is_empty() || hard_line.is_empty() {
            lines.push(current.trim_end().to_string());
        }
    }
    if lines.is_empty() {
        lines.push(String::new());
    }
    lines
}

fn inline_runs(block: &PdfBlock) -> Vec<PdfRun> {
    if block.content.is_empty() {
        return vec![PdfRun {
            text: block.text.clone(),
            marks: Vec::new(),
        }];
    }
    block
        .content
        .iter()
        .map(|span| PdfRun {
            text: span.text.clone(),
            marks: span.marks.clone(),
        })
        .collect()
}

fn wrap_runs(runs: &[PdfRun], width: f64, size: f64) -> Vec<Vec<PdfRun>> {
    let limit = max_chars(width, size);
    let mut lines: Vec<Vec<PdfRun>> = vec![Vec::new()];
    let mut count = 0usize;
    for run in runs {
        let mut token = String::new();
        let flush = |token: &mut String, lines: &mut Vec<Vec<PdfRun>>, count: &mut usize| {
            if token.is_empty() {
                return;
            }
            let mut value = token.clone();
            let leading_space = value.starts_with(' ');
            if leading_space && *count == 0 {
                value = value.trim_start().to_string();
            }
            if value.is_empty() {
                token.clear();
                return;
            }
            let token_len = value.chars().count();
            if *count > 0 && *count + token_len > limit {
                lines.push(Vec::new());
                *count = 0;
            }
            if let Some(line) = lines.last_mut() {
                line.push(PdfRun {
                    text: value.clone(),
                    marks: run.marks.clone(),
                });
            }
            *count += token_len;
            token.clear();
        };
        for ch in run.text.chars() {
            if ch == '\n' {
                flush(&mut token, &mut lines, &mut count);
                lines.push(Vec::new());
                count = 0;
            } else if ch.is_whitespace() {
                token.push(' ');
                flush(&mut token, &mut lines, &mut count);
            } else {
                token.push(ch);
            }
        }
        flush(&mut token, &mut lines, &mut count);
    }
    let lines: Vec<Vec<PdfRun>> = lines.into_iter().filter(|line| !line.is_empty()).collect();
    if lines.is_empty() {
        vec![Vec::new()]
    } else {
        lines
    }
}

fn has_mark(run: &PdfRun, kind: &str) -> bool {
    run.marks.iter().any(|mark| mark.kind == kind)
}

fn highlight_color(run: &PdfRun) -> Color {
    let value = run
        .marks
        .iter()
        .find(|mark| mark.kind == "highlight")
        .and_then(|mark| mark.color.as_deref())
        .unwrap_or("");
    let value = value.trim_start_matches('#');
    if value.len() == 6 {
        if let (Ok(red), Ok(green), Ok(blue)) = (
            u8::from_str_radix(&value[0..2], 16),
            u8::from_str_radix(&value[2..4], 16),
            u8::from_str_radix(&value[4..6], 16),
        ) {
            return Color::Rgb(Rgb::new(
                red as f32 / 255.0,
                green as f32 / 255.0,
                blue as f32 / 255.0,
                None,
            ));
        }
    }
    Color::Rgb(Rgb::new(0.86, 0.92, 0.88, None))
}

fn draw_rule(layer: &PdfLayerReference, x1: f64, y: f64, x2: f64, color: Color, thickness: f64) {
    layer.set_outline_color(color);
    layer.set_outline_thickness(thickness as f32);
    layer.add_line(Line {
        points: vec![
            (Point::new(Mm(x1 as f32), Mm(y as f32)), false),
            (Point::new(Mm(x2 as f32), Mm(y as f32)), false),
        ],
        is_closed: false,
    });
}

fn draw_vertical_rule(
    layer: &PdfLayerReference,
    x: f64,
    y1: f64,
    y2: f64,
    color: Color,
    thickness: f64,
) {
    layer.set_outline_color(color);
    layer.set_outline_thickness(thickness as f32);
    layer.add_line(Line {
        points: vec![
            (Point::new(Mm(x as f32), Mm(y1 as f32)), false),
            (Point::new(Mm(x as f32), Mm(y2 as f32)), false),
        ],
        is_closed: false,
    });
}

fn draw_box(layer: &PdfLayerReference, x: f64, y: f64, width: f64, height: f64, color: Color) {
    layer.set_fill_color(color);
    layer.add_polygon(Polygon {
        rings: vec![vec![
            (Point::new(Mm(x as f32), Mm(y as f32)), false),
            (Point::new(Mm((x + width) as f32), Mm(y as f32)), false),
            (
                Point::new(Mm((x + width) as f32), Mm((y + height) as f32)),
                false,
            ),
            (Point::new(Mm(x as f32), Mm((y + height) as f32)), false),
        ]],
        mode: PaintMode::Fill,
        winding_order: printpdf::path::WindingOrder::NonZero,
    });
}

fn draw_rich_lines(
    canvas: &mut PdfCanvas,
    runs: &[PdfRun],
    width: f64,
    size: f64,
    line_height: f64,
    prefix: &str,
) {
    let mut wrapped = wrap_runs(runs, width - text_width_mm(prefix, size), size);
    if wrapped.is_empty() {
        wrapped.push(Vec::new());
    }
    for (line_index, line) in wrapped.iter().enumerate() {
        canvas.ensure_space(line_height);
        let layer = canvas.layer();
        let mut x = if line_index == 0 {
            MARGIN_X
        } else {
            MARGIN_X + text_width_mm(prefix, size)
        };
        if line_index == 0 && !prefix.is_empty() {
            layer.set_fill_color(Color::Rgb(Rgb::new(0.28, 0.31, 0.35, None)));
            layer.use_text(
                prefix,
                size as f32,
                Mm(x as f32),
                Mm(canvas.y as f32),
                &canvas.font,
            );
            x += text_width_mm(prefix, size);
        }
        for run in line {
            let run_width = text_width_mm(&run.text, size);
            if has_mark(run, "highlight") {
                draw_box(
                    &layer,
                    x - 0.5,
                    canvas.y - 1.4,
                    run_width + 1.0,
                    line_height - 0.8,
                    highlight_color(run),
                );
            }
            let color = if has_mark(run, "link") {
                Color::Rgb(Rgb::new(0.16, 0.42, 0.29, None))
            } else {
                Color::Rgb(Rgb::new(0.10, 0.12, 0.15, None))
            };
            layer.set_fill_color(color.clone());
            layer.use_text(
                run.text.clone(),
                size as f32,
                Mm(x as f32),
                Mm(canvas.y as f32),
                &canvas.font,
            );
            if has_mark(run, "underline") || has_mark(run, "link") {
                draw_rule(
                    &layer,
                    x,
                    canvas.y - 1.0,
                    x + run_width,
                    color.clone(),
                    0.25,
                );
            }
            if has_mark(run, "strike") {
                draw_rule(
                    &layer,
                    x,
                    canvas.y + (size * 0.28),
                    x + run_width,
                    color,
                    0.25,
                );
            }
            x += run_width;
        }
        canvas.advance(line_height);
    }
}

fn parse_table(value: &str) -> Vec<Vec<String>> {
    value
        .lines()
        .filter(|line| !line.trim().is_empty())
        .filter_map(|line| {
            let row: Vec<String> = line
                .trim()
                .trim_matches('|')
                .split('|')
                .map(|cell| cell.trim().to_string())
                .collect();
            if row.iter().all(|cell| {
                cell.chars()
                    .all(|ch| ch == '-' || ch == ':' || ch.is_whitespace())
            }) {
                None
            } else {
                Some(row)
            }
        })
        .collect()
}

fn draw_table(canvas: &mut PdfCanvas, value: &str) {
    let rows = parse_table(value);
    if rows.is_empty() {
        return;
    }
    let columns = rows.iter().map(|row| row.len()).max().unwrap_or(1).max(1);
    let column_width = CONTENT_WIDTH / columns as f64;
    let cell_padding = 3.0;
    for (row_index, row) in rows.iter().enumerate() {
        let mut wrapped_cells = Vec::new();
        let mut row_height: f64 = 7.0;
        for column in 0..columns {
            let cell = row.get(column).map(String::as_str).unwrap_or("");
            let lines = wrap_text(cell, column_width - cell_padding * 2.0, 8.5);
            row_height = row_height.max(lines.len() as f64 * 4.4 + cell_padding * 2.0);
            wrapped_cells.push(lines);
        }
        canvas.ensure_space(row_height);
        let top = canvas.y;
        let bottom = top - row_height;
        let layer = canvas.layer();
        if row_index == 0 {
            draw_box(
                &layer,
                MARGIN_X,
                bottom,
                CONTENT_WIDTH,
                row_height,
                Color::Rgb(Rgb::new(0.93, 0.95, 0.94, None)),
            );
        }
        for column in 0..=columns {
            let x = MARGIN_X + column as f64 * column_width;
            draw_vertical_rule(
                &layer,
                x,
                top,
                bottom,
                Color::Greyscale(Greyscale::new(0.72, None)),
                0.2,
            );
        }
        draw_rule(
            &layer,
            MARGIN_X,
            top,
            MARGIN_X + CONTENT_WIDTH,
            Color::Greyscale(Greyscale::new(0.72, None)),
            0.2,
        );
        draw_rule(
            &layer,
            MARGIN_X,
            bottom,
            MARGIN_X + CONTENT_WIDTH,
            Color::Greyscale(Greyscale::new(0.72, None)),
            0.2,
        );
        for column in 0..columns {
            let x = MARGIN_X + column as f64 * column_width + cell_padding;
            let mut line_y = top - 5.2;
            for line in &wrapped_cells[column] {
                layer.set_fill_color(Color::Rgb(Rgb::new(0.10, 0.12, 0.15, None)));
                layer.use_text(
                    line.clone(),
                    8.5,
                    Mm(x as f32),
                    Mm(line_y as f32),
                    &canvas.font,
                );
                line_y -= 4.4;
            }
        }
        canvas.advance(row_height);
    }
    canvas.advance(7.0);
}

#[tauri::command]
fn export_pdf(path: String, document: PdfDocument) -> Result<(), String> {
    let (pdf, page, layer) = NativePdfDocument::new(
        &document.title,
        Mm(PAGE_WIDTH as f32),
        Mm(PAGE_HEIGHT as f32),
        "Grapho",
    );
    let font = pdf
        .add_external_font(Cursor::new(GEIST_FONT))
        .map_err(|error| format!("Could not load Grapho font: {error}"))?;
    let mut canvas = PdfCanvas::new(pdf, page, layer, font);
    canvas
        .layer()
        .set_fill_color(Color::Rgb(Rgb::new(0.06, 0.07, 0.09, None)));
    canvas.layer().use_text(
        document.title.clone(),
        22.0,
        Mm(MARGIN_X as f32),
        Mm(canvas.y as f32),
        &canvas.font,
    );
    canvas.advance(16.0);
    let mut ordered_index = 0_u32;
    for block in document.blocks {
        if block.r#type == "page-break" {
            canvas.new_page();
            ordered_index = 0;
            continue;
        }
        if block.r#type == "table" {
            draw_table(&mut canvas, &block.text);
            ordered_index = 0;
            continue;
        }
        let size = match block.r#type.as_str() {
            "heading" => 16.0,
            "code" => 9.0,
            _ => 11.0,
        };
        let line_height = if size >= 16.0 { 8.0 } else { 5.8 };
        let prefix = match block.r#type.as_str() {
            "list" => "• ".to_string(),
            "ordered-list" => {
                ordered_index += 1;
                format!("{}. ", ordered_index)
            }
            "todo" => format!("{} ", if block.checked { "☑" } else { "☐" }),
            "quote" => "“ ".to_string(),
            "toggle" => format!("{} ", if block.collapsed { "›" } else { "⌄" }),
            _ => {
                ordered_index = 0;
                String::new()
            }
        };
        let runs = inline_runs(&block);
        if block.r#type == "divider" {
            canvas.ensure_space(8.0);
            draw_rule(
                &canvas.layer(),
                MARGIN_X,
                canvas.y,
                MARGIN_X + CONTENT_WIDTH,
                Color::Greyscale(Greyscale::new(0.72, None)),
                0.35,
            );
            canvas.advance(8.0);
            continue;
        }
        if block.r#type == "callout" {
            let lines = wrap_runs(&runs, CONTENT_WIDTH - 12.0, 11.0);
            let height = lines.len().max(1) as f64 * 5.8 + 8.0;
            canvas.ensure_space(height);
            draw_box(
                &canvas.layer(),
                MARGIN_X,
                canvas.y - height + 2.0,
                CONTENT_WIDTH,
                height,
                Color::Rgb(Rgb::new(0.91, 0.95, 0.92, None)),
            );
            draw_rich_lines(&mut canvas, &runs, CONTENT_WIDTH - 12.0, 11.0, 5.8, "");
            canvas.advance(3.0);
        } else if block.r#type == "code" {
            let lines = wrap_text(&block.text, CONTENT_WIDTH - 10.0, size);
            let height = lines.len().max(1) as f64 * 4.8 + 8.0;
            canvas.ensure_space(height);
            draw_box(
                &canvas.layer(),
                MARGIN_X,
                canvas.y - height + 2.0,
                CONTENT_WIDTH,
                height,
                Color::Rgb(Rgb::new(0.93, 0.94, 0.95, None)),
            );
            for line in lines {
                canvas
                    .layer()
                    .set_fill_color(Color::Rgb(Rgb::new(0.12, 0.14, 0.17, None)));
                canvas.layer().use_text(
                    line,
                    size as f32,
                    Mm((MARGIN_X + 5.0) as f32),
                    Mm((canvas.y - 4.0) as f32),
                    &canvas.font,
                );
                canvas.advance(4.8);
            }
            canvas.advance(3.0);
        } else {
            draw_rich_lines(
                &mut canvas,
                &runs,
                CONTENT_WIDTH,
                size,
                line_height,
                &prefix,
            );
            canvas.advance(if block.r#type == "heading" { 5.0 } else { 4.0 });
        }
    }
    canvas
        .document
        .save(&mut std::io::BufWriter::new(
            fs::File::create(path).map_err(|error| error.to_string())?,
        ))
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            load_native_workspace,
            save_native_workspace,
            export_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running Grapho");
}
