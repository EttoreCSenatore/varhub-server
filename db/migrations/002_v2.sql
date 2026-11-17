-- 002: roles, project types/media, indexes. Idempotent; safe on databases created by the original scripts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'visitor';

ALTER TABLE projects ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'model';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS page_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ios_model_url VARCHAR(500);
ALTER TABLE projects ALTER COLUMN ar_model_url TYPE VARCHAR(500);
ALTER TABLE projects ALTER COLUMN thumbnail_url TYPE VARCHAR(500);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('visitor', 'admin'));
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE projects ADD CONSTRAINT projects_type_check CHECK (type IN ('model', 'video360', 'webxr', 'link'));
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('draft', 'published', 'archived')) NOT VALID;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_rating_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_rating_check CHECK (rating BETWEEN 1 AND 5) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_feedback_project ON feedback (project_id);
CREATE INDEX IF NOT EXISTS idx_engagement_project_action ON engagement_logs (project_id, action_type);
CREATE INDEX IF NOT EXISTS idx_engagement_created ON engagement_logs (created_at);
