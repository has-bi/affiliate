-- Migration: Add batch processing configuration to schedules
-- Date: 2025-01-26

-- Add batch processing fields to scheduled_messages table
ALTER TABLE "scheduled_messages" ADD COLUMN "batch_size" INTEGER DEFAULT 50;
ALTER TABLE "scheduled_messages" ADD COLUMN "batch_delay" INTEGER DEFAULT 300;
ALTER TABLE "scheduled_messages" ADD COLUMN "daily_limit" INTEGER;
ALTER TABLE "scheduled_messages" ADD COLUMN "retry_config" JSONB;

-- Create batch execution tracking table
CREATE TABLE IF NOT EXISTS "schedule_batches" (
  "id" SERIAL PRIMARY KEY,
  "schedule_id" INTEGER NOT NULL REFERENCES "scheduled_messages"("id") ON DELETE CASCADE,
  "batch_number" INTEGER NOT NULL,
  "recipients_count" INTEGER NOT NULL,
  "success_count" INTEGER DEFAULT 0,
  "failed_count" INTEGER DEFAULT 0,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "status" TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  "error_message" TEXT,
  "next_batch_at" TIMESTAMP(3), -- when next batch should run
  
  UNIQUE("schedule_id", "batch_number")
);

-- Create message queue table for better reliability  
CREATE TABLE IF NOT EXISTS "message_queue" (
  "id" SERIAL PRIMARY KEY,
  "schedule_id" INTEGER REFERENCES "scheduled_messages"("id") ON DELETE CASCADE,
  "batch_id" INTEGER REFERENCES "schedule_batches"("id") ON DELETE CASCADE,
  "recipient" TEXT NOT NULL,
  "message_content" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "priority" TEXT DEFAULT 'normal', -- high, normal, low
  "status" TEXT DEFAULT 'pending', -- pending, processing, sent, failed
  "attempts" INTEGER DEFAULT 0,
  "max_attempts" INTEGER DEFAULT 3,
  "scheduled_for" TIMESTAMP(3) NOT NULL,
  "sent_at" TIMESTAMP(3),
  "error_message" TEXT,
  "response_data" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_schedule_batches_schedule_id" ON "schedule_batches"("schedule_id");
CREATE INDEX IF NOT EXISTS "idx_schedule_batches_status" ON "schedule_batches"("status");
CREATE INDEX IF NOT EXISTS "idx_schedule_batches_next_batch_at" ON "schedule_batches"("next_batch_at");

CREATE INDEX IF NOT EXISTS "idx_message_queue_status" ON "message_queue"("status");
CREATE INDEX IF NOT EXISTS "idx_message_queue_scheduled_for" ON "message_queue"("scheduled_for");
CREATE INDEX IF NOT EXISTS "idx_message_queue_schedule_id" ON "message_queue"("schedule_id");
CREATE INDEX IF NOT EXISTS "idx_message_queue_priority" ON "message_queue"("priority", "scheduled_for");