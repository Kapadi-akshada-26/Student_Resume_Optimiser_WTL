-- Phase 0: persist every studio analysis in a dedicated scores table.
-- Existing `analysis` rows are left untouched; new analyses write to both tables.

USE student_resume_db;

CREATE TABLE IF NOT EXISTS resume_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resume_id INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    breakdown JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
