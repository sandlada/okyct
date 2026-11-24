use std::fs;
use std::path::{Path, PathBuf};

use okyct::{ArchitectureReference, verify_hexagonal_architecture_boundaries};

fn collect_rs_files(dir: &Path, out: &mut Vec<PathBuf>) {
    for entry in fs::read_dir(dir).unwrap() {
        let path = entry.unwrap().path();
        if path.is_dir() {
            collect_rs_files(&path, out);
        } else if path.extension().and_then(|e| e.to_str()) == Some("rs") {
            out.push(path);
        }
    }
}

fn module_path_from_file(src_root: &Path, file: &Path) -> String {
    let rel = file.strip_prefix(src_root).unwrap();
    let parts: Vec<&str> = rel
        .components()
        .filter_map(|c| c.as_os_str().to_str())
        .collect();
    let mut segs = Vec::new();
    for (i, part) in parts.iter().enumerate() {
        if i + 1 == parts.len() {
            if *part == "mod.rs" || *part == "lib.rs" {
                continue;
            }
            segs.push(part.trim_end_matches(".rs"));
        } else {
            segs.push(part);
        }
    }
    if segs.is_empty() {
        "crate".to_string()
    } else {
        format!("crate::{}", segs.join("::"))
    }
}

#[test]
fn hexagonal_architecture_boundaries_are_respected() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let src_root = manifest_dir.join("src");
    let mut files = Vec::new();
    collect_rs_files(&src_root, &mut files);

    let mut references = Vec::new();
    for file in &files {
        let mod_path = module_path_from_file(&src_root, file);
        let content = fs::read_to_string(file).unwrap();
        for line in content.lines() {
            let trimmed = line.trim();
            if let Some(rest) = trimmed.strip_prefix("use crate::") {
                let target = rest.split([';', '{', ' ']).next().unwrap_or("").trim_end_matches("::");
                references.push(ArchitectureReference {
                    file: file.display().to_string(),
                    module_path: mod_path.clone(),
                    target_path: format!("crate::{target}"),
                });
            }
        }
    }

    let result = verify_hexagonal_architecture_boundaries(&references, files.len());
    assert!(
        result.passed,
        "Hexagonal architecture violations: {:?}",
        result.violations
    );
}
