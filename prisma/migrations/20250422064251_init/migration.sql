-- CreateTable
CREATE TABLE "templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_parameters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "template_id" INTEGER NOT NULL,

    CONSTRAINT "template_parameters_pkey" PRIMARY KEY ("template_id","id")
);

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "template_id" INTEGER NOT NULL,
    "schedule_type" TEXT NOT NULL,
    "cron_expression" TEXT,
    "scheduled_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "session_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_run" TIMESTAMP(3),
    "next_run" TIMESTAMP(3),

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_message_params" (
    "scheduled_message_id" INTEGER NOT NULL,
    "param_id" TEXT NOT NULL,
    "param_value" TEXT,

    CONSTRAINT "scheduled_message_params_pkey" PRIMARY KEY ("scheduled_message_id","param_id")
);

-- CreateTable
CREATE TABLE "scheduled_message_recipients" (
    "scheduled_message_id" INTEGER NOT NULL,
    "recipient" TEXT NOT NULL,

    CONSTRAINT "scheduled_message_recipients_pkey" PRIMARY KEY ("scheduled_message_id","recipient")
);

-- CreateTable
CREATE TABLE "scheduled_message_history" (
    "id" SERIAL NOT NULL,
    "scheduled_message_id" INTEGER NOT NULL,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,

    CONSTRAINT "scheduled_message_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "template_parameters" ADD CONSTRAINT "template_parameters_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_message_params" ADD CONSTRAINT "scheduled_message_params_scheduled_message_id_fkey" FOREIGN KEY ("scheduled_message_id") REFERENCES "scheduled_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_message_recipients" ADD CONSTRAINT "scheduled_message_recipients_scheduled_message_id_fkey" FOREIGN KEY ("scheduled_message_id") REFERENCES "scheduled_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_message_history" ADD CONSTRAINT "scheduled_message_history_scheduled_message_id_fkey" FOREIGN KEY ("scheduled_message_id") REFERENCES "scheduled_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
