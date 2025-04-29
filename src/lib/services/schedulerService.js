// src/lib/services/schedulerService.js
// Final, consolidated version – integrates dynamic+static parameter filling
// and pulls contact data only for affiliates whose Status === "contacted".
// -------------------------------------------------------------------------
import schedule from "node-schedule";

import {
  getAllSchedules,
  updateSchedule,
  addScheduleHistory,
  getScheduleById,
} from "../scheduleUtils";

import { getTemplateById, getFinalMessageForContact } from "../templateUtils";

import { formatPhoneNumber } from "../utils";
import { getActiveAffiliates } from "../spreadsheetService";

// -------------------------------------------------------------------------
// SchedulerService – singleton class that:
//   • loads schedules from DB
//   • registers node‑schedule jobs
//   • executes the job: builds personalised message & hits WAHA API
// -------------------------------------------------------------------------
class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.wahaApiUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL || "https://wabot.youvit.co.id";
  }

  // -----------------------------------------------------------------------
  // Initialise – call once on server boot or via `initializeSchedules()`
  // -----------------------------------------------------------------------
  async init() {
    console.log("[Scheduler] Loading active schedules …");

    const schedules = await getAllSchedules();
    schedules
      .filter((s) => s.status === "active")
      .forEach((s) => this.scheduleJob(s));

    console.log(`[Scheduler] Loaded ${schedules.length} schedules.`);
  }

  // -----------------------------------------------------------------------
  // Cancel + re‑create a job (idempotent)
  // -----------------------------------------------------------------------
  scheduleJob(scheduleData) {
    // Guard: cancel previous instance (if rescheduling)
    if (this.jobs.has(scheduleData.id)) {
      this.cancelJob(scheduleData.id);
    }

    try {
      let job;

      // ONE‑OFF SCHEDULE ----------------------------------------------------
      if (scheduleData.scheduleType === "once") {
        const date = new Date(scheduleData.scheduleConfig.date);

        job = schedule.scheduleJob(date, () => this._runJob(scheduleData.id));

        console.log(`Created one‑time job for schedule ${scheduleData.id}`);

        // RECURRING SCHEDULE --------------------------------------------------
      } else if (scheduleData.scheduleType === "recurring") {
        const cron = scheduleData.scheduleConfig.cronExpression;

        job = schedule.scheduleJob(cron, () => this._runJob(scheduleData.id));

        console.log(`Created recurring job for schedule ${scheduleData.id}`);
      }

      if (!job) throw new Error("Failed to create node‑schedule job");

      this.jobs.set(scheduleData.id, job);
      const nextRun = job.nextInvocation();
      updateSchedule(scheduleData.id, {
        nextRun: nextRun ? nextRun.toISOString() : null,
      });
    } catch (err) {
      console.error(
        `[Scheduler] Error registering schedule ${scheduleData.id}:`,
        err
      );
      updateSchedule(scheduleData.id, { status: "failed" });
    }
  }

  cancelJob(scheduleId) {
    const job = this.jobs.get(scheduleId);
    if (job) job.cancel();
    this.jobs.delete(scheduleId);
  }

  // -----------------------------------------------------------------------
  // Core execution logic – called by node‑schedule
  // -----------------------------------------------------------------------
  async _runJob(scheduleId) {
    console.log(`\n===== Executing schedule ${scheduleId} =====`);

    const scheduleData = await getScheduleById(scheduleId);
    if (!scheduleData) {
      console.error(`Schedule ${scheduleId} not found – cancelling job.`);
      this.cancelJob(scheduleId);
      return;
    }

    try {
      // 1️⃣  Pre‑fetch active affiliates *once* per job run
      const affiliates = await getActiveAffiliates();

      // 2️⃣  Load template & compute message per recipient
      const template = await getTemplateById(scheduleData.templateId);
      if (!template) throw new Error("Template not found");

      let success = 0;
      let failed = 0;
      const details = [];

      for (const rawPhone of scheduleData.recipients) {
        const formatted = formatPhoneNumber(rawPhone);
        const contact = affiliates[rawPhone] ?? {}; // may be empty {}

        const text = getFinalMessageForContact(
          template.content,
          contact,
          scheduleData.paramValues // static params
        );

        if (!text) {
          failed += 1;
          details.push({ phone: rawPhone, error: "template‑fill" });
          continue;
        }

        // 3️⃣  Call WAHA API
        try {
          const res = await fetch(`${this.wahaApiUrl}/api/sendText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId: formatted,
              text,
              session: scheduleData.sessionName,
            }),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          success += 1;
          details.push({ phone: rawPhone, status: "sent" });
        } catch (apiErr) {
          failed += 1;
          details.push({ phone: rawPhone, error: apiErr.message });
        }
      }

      // 4️⃣  Persist history
      await addScheduleHistory(scheduleId, {
        successCount: success,
        failedCount: failed,
        details,
      });

      // 5️⃣  Update last/next run timestamps
      const job = this.jobs.get(scheduleId);
      const nextRun = job?.nextInvocation() || null;
      await updateSchedule(scheduleId, {
        lastRun: new Date().toISOString(),
        nextRun: nextRun ? nextRun.toISOString() : null,
      });

      console.log(
        `Schedule ${scheduleId} finished – OK:${success} NOK:${failed}`
      );
    } catch (err) {
      console.error(`[Scheduler] Fatal error in schedule ${scheduleId}:`, err);
      await addScheduleHistory(scheduleId, {
        successCount: 0,
        failedCount: scheduleData.recipients.length,
        details: [{ error: err.message }],
      });
      await updateSchedule(scheduleId, { status: "failed" });
    }
  }
}

// -------------------------------------------------------------------------
// Singleton export & immediate init
// -------------------------------------------------------------------------
const schedulerService = new SchedulerService();
console.log("[Scheduler] Initialising …");
schedulerService.init().catch((e) => {
  console.error("[Scheduler] Init failed:", e);
});

export async function initializeSchedules() {
  return schedulerService.init();
}

export default schedulerService;
