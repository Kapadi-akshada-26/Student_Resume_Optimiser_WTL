-- Phase 1: ATS file-check history. Raw uploaded files are never stored.

USE student_resume_db;

CREATE TABLE IF NOT EXISTS ats_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(255) DEFAULT NULL,
    score INT NOT NULL DEFAULT 0,
    breakdown JSON,
    parsed_resume JSON,
    jd_text TEXT,
    match_percent DECIMAL(6,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
