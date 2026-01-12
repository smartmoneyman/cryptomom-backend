import cron from "node-cron";
import { runHourly } from "./src/jobs/hourly.js";
import { startServer } from "./src/api/server.js";
import { runtimeState } from "./src/runtime/state.js";

// Запуск API
startServer(3000);

// BOOTSTRAP-режим: каждые 5 минут
const bootstrapJob = cron.schedule("*/5 * * * *", async () => {
  console.log("⚡ Bootstrap run");
  await runHourly();

  if (runtimeState.mode === "normal") {
    console.log("⏱ Bootstrap finished → switching to hourly mode");
    bootstrapJob.stop();
  }
});

// NORMAL-режим: каждый час (на 5-й минуте)
cron.schedule("5 * * * *", async () => {
  if (runtimeState.mode !== "normal") return;

  console.log("⏱ Hourly run");
  await runHourly();
});

// Первый запуск сразу при старте
(async () => {
  console.log("🚀 Initial run");
  await runHourly();
})();
