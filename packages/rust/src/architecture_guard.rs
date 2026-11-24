#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ArchitectureReference {
    pub file: String,
    pub module_path: String,
    pub target_path: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ArchitectureViolation {
    pub file: String,
    pub target_path: String,
    pub rule: &'static str,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ArchitectureAuditResult {
    pub passed: bool,
    pub files_scanned: usize,
    pub violations: Vec<ArchitectureViolation>,
}

fn layer_of(module_path: &str) -> Option<&'static str> {
    let trimmed = module_path.trim_start_matches("crate::");
    let first = trimmed.split("::").next()?;
    match first {
        "domain" => Some("domain"),
        "ports" => Some("ports"),
        "application" => Some("application"),
        "adapters" => Some("adapters"),
        _ => None,
    }
}

pub fn verify_hexagonal_architecture_boundaries(
    references: &[ArchitectureReference],
    files_scanned: usize,
) -> ArchitectureAuditResult {
    let mut violations = Vec::new();

    for reference in references {
        let Some(src_layer) = layer_of(&reference.module_path) else {
            continue;
        };
        let target_trimmed = reference.target_path.trim_start_matches("crate::");
        let target_layer = layer_of(target_trimmed);

        match (src_layer, target_layer) {
            ("domain", Some("ports" | "application" | "adapters")) => {
                violations.push(ArchitectureViolation {
                    file: reference.file.clone(),
                    target_path: reference.target_path.clone(),
                    rule: "forbidden-layer-dependency",
                    message: format!(
                        "Domain layer must have zero outer dependencies, found {}",
                        reference.target_path
                    ),
                });
            }
            ("ports", Some("application" | "adapters")) => {
                violations.push(ArchitectureViolation {
                    file: reference.file.clone(),
                    target_path: reference.target_path.clone(),
                    rule: "forbidden-layer-dependency",
                    message: format!(
                        "Ports layer must not depend on {}, found {}",
                        target_layer.unwrap(),
                        reference.target_path
                    ),
                });
            }
            ("ports", Some("domain")) if target_trimmed.starts_with("domain::services") => {
                violations.push(ArchitectureViolation {
                    file: reference.file.clone(),
                    target_path: reference.target_path.clone(),
                    rule: "ports-domain-services-import",
                    message: format!(
                        "Ports layer may only depend on domain::models, not {}",
                        reference.target_path
                    ),
                });
            }
            ("application", Some("adapters")) => {
                violations.push(ArchitectureViolation {
                    file: reference.file.clone(),
                    target_path: reference.target_path.clone(),
                    rule: "forbidden-layer-dependency",
                    message: format!(
                        "Application layer must not depend on Adapters, found {}",
                        reference.target_path
                    ),
                });
            }
            _ => {}
        }
    }

    ArchitectureAuditResult {
        passed: violations.is_empty(),
        files_scanned,
        violations,
    }
}
