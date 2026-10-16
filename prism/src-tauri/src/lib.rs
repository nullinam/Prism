use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize)]
struct ImageInfo {
    name: String,
    width: Option<u32>,
    height: Option<u32>,
    format: String,
    size_bytes: u64,
    error: Option<String>,
}

#[tauri::command]
fn inspect_images(paths: Vec<String>) -> Vec<ImageInfo> {
    paths
        .into_iter()
        .map(|path| inspect_image(Path::new(&path)))
        .collect()
}

fn inspect_image(path: &Path) -> ImageInfo {
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("Image")
        .to_owned();

    let size_bytes = match std::fs::metadata(path) {
        Ok(metadata) => metadata.len(),
        Err(error) => {
            return ImageInfo {
                name,
                width: None,
                height: None,
                format: "Unknown".into(),
                size_bytes: 0,
                error: Some(format!("Could not read file metadata: {error}")),
            };
        }
    };

    let reader = match image::ImageReader::open(path).and_then(|reader| reader.with_guessed_format()) {
        Ok(reader) => reader,
        Err(error) => {
            return ImageInfo {
                name,
                width: None,
                height: None,
                format: "Unknown".into(),
                size_bytes,
                error: Some(format!("Could not identify image format: {error}")),
            };
        }
    };

    let format = reader
        .format()
        .map(|value| format!("{value:?}").to_uppercase())
        .unwrap_or_else(|| "UNKNOWN".into());

    match reader.into_dimensions() {
        Ok((width, height)) => ImageInfo {
            name,
            width: Some(width),
            height: Some(height),
            format,
            size_bytes,
            error: None,
        },
        Err(error) => ImageInfo {
            name,
            width: None,
            height: None,
            format,
            size_bytes,
            error: Some(format!("Could not read image dimensions: {error}")),
        },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![inspect_images])
        .run(tauri::generate_context!())
        .expect("error while running PRISM");
}
