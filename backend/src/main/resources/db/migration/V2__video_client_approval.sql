-- When the client explicitly approved the video in their portal (REVIEW -> COMPLETED).
-- Null when the editor completed it themselves or it hasn't been approved; cleared if the video
-- is moved back before COMPLETED.
ALTER TABLE videos ADD COLUMN approved_at TIMESTAMPTZ;
