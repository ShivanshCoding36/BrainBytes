-- Add pending_tokens column to user_progress table
ALTER TABLE "user_progress"
ADD COLUMN "pending_tokens" integer DEFAULT 0 NOT NULL;