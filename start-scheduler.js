// Simple scheduler starter for Node.js
// Use dynamic import since the schedulerService uses ES modules
async function loadScheduler() {
  const { initializeSchedules } = await import('./src/lib/schedules/schedulerService.js');
  return { initializeSchedules };
}

console.log('[Worker] Starting scheduler worker...');

async function startWorker() {
  try {
    const { initializeSchedules } = await loadScheduler();
    await initializeSchedules();
    console.log('[Worker] ✅ Scheduler initialized successfully');
    console.log('[Worker] 🚀 Worker running and waiting for schedules...');

    // Keep the process running
    process.stdin.resume();

    // Handle termination gracefully
    process.on('SIGINT', () => {
      console.log('[Worker] 👋 Gracefully shutting down...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('[Worker] 👋 Gracefully shutting down...');
      process.exit(0);
    });

  } catch (error) {
    console.error('[Worker] ❌ Failed to start scheduler worker:', error);
    process.exit(1);
  }
}

startWorker().catch((error) => {
  console.error('[Worker] ❌ Unhandled error:', error);
  process.exit(1);
});