#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use printpdf::{BuiltinFont, Mm, PdfDocument as NativePdfDocument};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

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

#[derive(Deserialize)]
struct PdfBlock {
    text: String,
    #[serde(default)]
    r#type: String,
}

#[derive(Deserialize)]
struct PdfDocument {
    title: String,
    blocks: Vec<PdfBlock>,
}

#[tauri::command]
fn export_pdf(path: String, document: PdfDocument) -> Result<(), String> {
    let (pdf, page, layer) =
        NativePdfDocument::new(&document.title, Mm(210.0), Mm(297.0), "Grapho");
    let font = pdf
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|error| error.to_string())?;
    let bold = pdf
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|error| error.to_string())?;
    let mut current_page = page;
    let mut current_layer = layer;
    let mut y = 270.0_f64;
    let write_line = |text: &str,
                      size: f64,
                      bold_text: bool,
                      y: &mut f64,
                      layer_id: printpdf::PdfLayerReference| {
        layer_id.use_text(
            text,
            size as f32,
            Mm(24.0),
            Mm(*y as f32),
            if bold_text { &bold } else { &font },
        );
        *y -= if size > 14.0 { 10.0 } else { 7.0 };
    };
    write_line(
        &document.title,
        22.0,
        true,
        &mut y,
        pdf.get_page(current_page).get_layer(current_layer),
    );
    y -= 10.0;
    for block in document.blocks {
        if block.r#type == "page-break" || y < 25.0 {
            let added = pdf.add_page(Mm(210.0), Mm(297.0), "Grapho");
            current_page = added.0;
            current_layer = added.1;
            y = 270.0;
        }
        let size = if block.r#type == "heading" {
            16.0
        } else if block.r#type == "code" {
            9.0
        } else {
            11.0
        };
        let bold_text = block.r#type == "heading";
        for paragraph in block.text.lines() {
            let prefix = if block.r#type == "list" {
                "• "
            } else if block.r#type == "ordered-list" {
                "1. "
            } else if block.r#type == "quote" {
                "“ "
            } else {
                ""
            };
            for line in paragraph.as_bytes().chunks(92) {
                let text = String::from_utf8_lossy(line);
                if y < 20.0 {
                    let added = pdf.add_page(Mm(210.0), Mm(297.0), "Grapho");
                    current_page = added.0;
                    current_layer = added.1;
                    y = 270.0;
                }
                write_line(
                    &format!("{}{}", prefix, text),
                    size,
                    bold_text,
                    &mut y,
                    pdf.get_page(current_page).get_layer(current_layer),
                );
            }
        }
        y -= 6.0;
    }
    pdf.save(&mut std::io::BufWriter::new(
        fs::File::create(path).map_err(|error| error.to_string())?,
    ))
    .map_err(|error| error.to_string())
}

fn main() {
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
