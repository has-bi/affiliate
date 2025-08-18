-- A/B Testing Schema Migration
-- Creates tables for A/B testing experiments with cooldown and rate limiting

-- Experiments table: Main experiment configuration
CREATE TABLE IF NOT EXISTS "ab_experiments" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed, cancelled
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "started_at" TIMESTAMP,
  "ended_at" TIMESTAMP,
  "session_name" VARCHAR(255) NOT NULL,
  "total_recipients" INTEGER DEFAULT 0,
  "cooldown_minutes" INTEGER DEFAULT 5, -- Cooldown between batches
  "batch_size" INTEGER DEFAULT 50, -- Messages per batch
  "created_by" VARCHAR(255),
  "settings" JSON -- Additional experiment settings
);

-- Variants table: A/B test variants (A, B, C, etc.)
CREATE TABLE IF NOT EXISTS "ab_variants" (
  "id" SERIAL PRIMARY KEY,
  "experiment_id" INTEGER NOT NULL REFERENCES "ab_experiments"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL, -- 'A', 'B', 'C', etc.
  "template_id" INTEGER REFERENCES "templates"("id"),
  "custom_message" TEXT, -- Custom message if not using template
  "allocation_percentage" INTEGER DEFAULT 50, -- % of traffic to this variant
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Experiment Recipients: Tracks which recipients are in the experiment
CREATE TABLE IF NOT EXISTS "ab_recipients" (
  "id" SERIAL PRIMARY KEY,
  "experiment_id" INTEGER NOT NULL REFERENCES "ab_experiments"("id") ON DELETE CASCADE,
  "variant_id" INTEGER NOT NULL REFERENCES "ab_variants"("id") ON DELETE CASCADE,
  "phone_number" VARCHAR(255) NOT NULL,
  "assigned_at" TIMESTAMP DEFAULT NOW(),
  "status" VARCHAR(50) DEFAULT 'assigned', -- assigned, sent, failed, excluded
  UNIQUE("experiment_id", "phone_number")
);

-- Experiment Batches: Tracks sending batches for cooldown management
CREATE TABLE IF NOT EXISTS "ab_batches" (
  "id" SERIAL PRIMARY KEY,
  "experiment_id" INTEGER NOT NULL REFERENCES "ab_experiments"("id") ON DELETE CASCADE,
  "variant_id" INTEGER NOT NULL REFERENCES "ab_variants"("id") ON DELETE CASCADE,
  "batch_number" INTEGER NOT NULL,
  "sent_at" TIMESTAMP DEFAULT NOW(),
  "recipient_count" INTEGER DEFAULT 0,
  "success_count" INTEGER DEFAULT 0,
  "failed_count" INTEGER DEFAULT 0,
  "next_batch_allowed_at" TIMESTAMP, -- When next batch can be sent
  "status" VARCHAR(50) DEFAULT 'pending' -- pending, sending, completed, failed
);

-- Message Results: Individual message sending results
CREATE TABLE IF NOT EXISTS "ab_results" (
  "id" SERIAL PRIMARY KEY,
  "experiment_id" INTEGER NOT NULL REFERENCES "ab_experiments"("id") ON DELETE CASCADE,
  "variant_id" INTEGER NOT NULL REFERENCES "ab_variants"("id") ON DELETE CASCADE,
  "recipient_id" INTEGER NOT NULL REFERENCES "ab_recipients"("id") ON DELETE CASCADE,
  "batch_id" INTEGER REFERENCES "ab_batches"("id"),
  "sent_at" TIMESTAMP,
  "status" VARCHAR(50), -- sent, failed, pending
  "error_message" TEXT,
  "whatsapp_message_id" VARCHAR(255),
  "delivery_status" VARCHAR(50), -- delivered, read, failed
  "response_data" JSON -- Full response from WhatsApp API
);

-- Analytics aggregation table for performance
CREATE TABLE IF NOT EXISTS "ab_analytics" (
  "id" SERIAL PRIMARY KEY,
  "experiment_id" INTEGER NOT NULL REFERENCES "ab_experiments"("id") ON DELETE CASCADE,
  "variant_id" INTEGER NOT NULL REFERENCES "ab_variants"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "total_sent" INTEGER DEFAULT 0,
  "total_delivered" INTEGER DEFAULT 0,
  "total_read" INTEGER DEFAULT 0,
  "total_failed" INTEGER DEFAULT 0,
  "updated_at" TIMESTAMP DEFAULT NOW(),
  UNIQUE("experiment_id", "variant_id", "date")
);

-- Rate limiting table: Tracks sending activity for cooldown
CREATE TABLE IF NOT EXISTS "ab_rate_limits" (
  "id" SERIAL PRIMARY KEY,
  "session_name" VARCHAR(255) NOT NULL,
  "last_send_at" TIMESTAMP DEFAULT NOW(),
  "messages_sent_hour" INTEGER DEFAULT 0,
  "messages_sent_day" INTEGER DEFAULT 0,
  "cooldown_until" TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT NOW(),
  UNIQUE("session_name")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_ab_experiments_status" ON "ab_experiments"("status");
CREATE INDEX IF NOT EXISTS "idx_ab_experiments_session" ON "ab_experiments"("session_name");
CREATE INDEX IF NOT EXISTS "idx_ab_recipients_experiment" ON "ab_recipients"("experiment_id");
CREATE INDEX IF NOT EXISTS "idx_ab_recipients_variant" ON "ab_recipients"("variant_id");
CREATE INDEX IF NOT EXISTS "idx_ab_recipients_phone" ON "ab_recipients"("phone_number");
CREATE INDEX IF NOT EXISTS "idx_ab_batches_experiment" ON "ab_batches"("experiment_id");
CREATE INDEX IF NOT EXISTS "idx_ab_batches_next_allowed" ON "ab_batches"("next_batch_allowed_at");
CREATE INDEX IF NOT EXISTS "idx_ab_results_experiment" ON "ab_results"("experiment_id");
CREATE INDEX IF NOT EXISTS "idx_ab_results_variant" ON "ab_results"("variant_id");
CREATE INDEX IF NOT EXISTS "idx_ab_analytics_experiment_date" ON "ab_analytics"("experiment_id", "date");
CREATE INDEX IF NOT EXISTS "idx_ab_rate_limits_session" ON "ab_rate_limits"("session_name");

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ab_experiments_updated_at BEFORE UPDATE ON "ab_experiments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_variants_updated_at BEFORE UPDATE ON "ab_variants" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_analytics_updated_at BEFORE UPDATE ON "ab_analytics" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_rate_limits_updated_at BEFORE UPDATE ON "ab_rate_limits" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();