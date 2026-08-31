#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
}

#[derive(Deserialize)]
struct PdfDocument {
    title: String,
    blocks: Vec<PdfBlock>,
}

fn pdf_escape(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('(', "\\(")
        .replace(')', "\\)")
}

#[tauri::command]
fn export_pdf(path: String, document: PdfDocument) -> Result<(), String> {
    let mut lines = vec![document.title.clone(), String::new()];
    for block in document.blocks {
        for paragraph in block.text.split('\n') {
            let mut remaining = paragraph.trim().to_string();
            while remaining.chars().count() > 92 {
                let cut = remaining.chars().take(92).collect::<String>();
                let split = cut.rfind(' ').unwrap_or(92);
                lines.push(remaining[..split].to_string());
                remaining = remaining[split..].trim_start().to_string();
            }
            lines.push(remaining);
        }
        lines.push(String::new());
    }
    let mut stream = String::from("BT\n/F1 18 Tf\n54 760 Td\n");
    for (index, line) in lines.iter().enumerate() {
        if index == 1 {
            stream.push_str("/F1 10 Tf\n0 -28 Td\n");
        } else if index > 1 {
            stream.push_str("0 -16 Td\n");
        }
        stream.push_str(&format!("({}) Tj\n", pdf_escape(line)));
    }
    stream.push_str("ET");
    let objects = [
        "<< /Type /Catalog /Pages 2 0 R >>".to_string(),
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>".to_string(),
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>".to_string(),
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>".to_string(),
        format!("<< /Length {} >>\nstream\n{}\nendstream", stream.len(), stream),
    ];
    let mut pdf = String::from("%PDF-1.4\n");
    let mut offsets = vec![0usize];
    for (index, object) in objects.iter().enumerate() {
        offsets.push(pdf.len());
        pdf.push_str(&format!("{} 0 obj\n{}\nendobj\n", index + 1, object));
    }
    let xref = pdf.len();
    pdf.push_str(&format!(
        "xref\n0 {}\n0000000000 65535 f \n",
        objects.len() + 1
    ));
    for offset in offsets.iter().skip(1) {
        pdf.push_str(&format!("{:010} 00000 n \n", offset));
    }
    pdf.push_str(&format!(
        "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{}\n%%EOF\n",
        objects.len() + 1,
        xref
    ));
    fs::write(path, pdf.as_bytes()).map_err(|error| error.to_string())
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
