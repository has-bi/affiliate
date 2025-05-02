// src/lib/services/schedulerService.js
import schedule from "node-schedule";
import prisma from "@/lib/prisma";
import baileysClient from "@/lib/whatsapp/wahaClient";
import { formatPhoneNumber, createLogger } from "@/lib/utils";

const logger = createLogger("[Scheduler]");

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  async init() {
    logger.info("Loading active schedules…");
    const active = await prisma.schedule.findMany({
      where: { status: "active" },
      include: { recipients: true, parameters: true },
    });
    active.forEach((s) => this.scheduleJob(s));
    logger.info(`Registered ${active.length} schedules`);
  }

  /** ------------------------------ helpers ----------------------------- **/
  _nextRunDate(s) {
    if (s.scheduleType === "once") return s.scheduledDate;
    // node-schedule can calculate “next” for a cron string:
    const tmp = schedule.scheduleJob(s.cronExpression, () => {});
    const next = tmp.nextInvocation();
    tmp.cancel(); // we only wanted the calc
    return next;
  }

  _cronOrDate(s) {
    return s.scheduleType === "once" ? s.scheduledDate : s.cronExpression;
  }

  /** ----------------------------- main API ----------------------------- **/
  scheduleJob(scheduleData) {
    // cancel any previous job instance
    this.cancelJob(scheduleData.id);

    try {
      const trigger = this._cronOrDate(scheduleData);
      if (!trigger) throw new Error("Missing cronExpression/scheduledDate");

      const job = schedule.scheduleJob(trigger, () =>
        this._runJob(scheduleData.id)
      );

      this.jobs.set(scheduleData.id, job);

      // store nextRun back to DB
      const nextRun = job.nextInvocation();
      prisma.schedule
        .update({
          where: { id: scheduleData.id },
          data: { nextRun },
        })
        .catch(console.error);

      logger.info(
        `⏰ Scheduled ${scheduleData.name} (${scheduleData.id}) – nextRun ${
          nextRun ? nextRun.toISOString() : "N/A"
        }`
      );
    } catch (err) {
      logger.error(`Failed to register schedule ${scheduleData.id}`, err);
      prisma.schedule
        .update({
          where: { id: scheduleData.id },
          data: { status: "failed" },
        })
        .catch(console.error);
    }
  }

  cancelJob(scheduleId) {
    const job = this.jobs.get(scheduleId);
    if (job) job.cancel();
    this.jobs.delete(scheduleId);
  }

  /** --------------------------- execution ----------------------------- **/
  async _runJob(scheduleId) {
    logger.info(`▶️  Executing schedule ${scheduleId}`);
    const s = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { recipients: true, parameters: true, template: true },
    });
    if (!s) return this.cancelJob(scheduleId);

    let ok = 0,
      fail = 0;
    const staticParams = Object.fromEntries(
      s.parameters.map((p) => [p.paramId, p.paramValue])
    );

    for (const r of s.recipients) {
      const phone = formatPhoneNumber(r.recipient);
      try {
        const text = getFinalMessageForContact(
          s.template.content,
          { phone },
          staticParams
        );
        await baileysClient.sendText(s.sessionName, phone, text);
        ok++;
      } catch (e) {
        fail++;
        logger.error(`sendText failed for ${phone}`, e);
      }
      await new Promise((res) => setTimeout(res, 800)); // anti‑rate‑limit
    }

    // history & bookkeeping
    await prisma.scheduleHistory.create({
      data: {
        scheduleId,
        successCount: ok,
        failedCount: fail,
        details: {}, // add per‑recipient details if you like
      },
    });

    // compute next run or finish
    const nextRun = this._nextRunDate(s);
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        lastRun: new Date(),
        nextRun,
        status: nextRun ? "active" : "completed",
      },
    });

    if (nextRun) this.scheduleJob({ ...s, nextRun }); // re‑register
    else this.cancelJob(scheduleId);

    logger.info(
      `✅  Done ${scheduleId}. OK ${ok}, NOK ${fail}. Next ${nextRun ?? "-"}`
    );
  }
}

export default new SchedulerService(); // auto‑instantiated elsewhere
