import { discoverAndStoreNewBusinesses } from "../src/lib/newBizDiscoverer";
import { pool } from "../src/lib/db";

async function main() {
  const corpArg = process.argv.find((a) => a.startsWith("--corp="));
  const ftcArg = process.argv.find((a) => a.startsWith("--ftc="));
  const corpLimit = corpArg ? Number(corpArg.split("=")[1]) : 10;
  const ftcLimit = ftcArg ? Number(ftcArg.split("=")[1]) : 15;

  console.log(
    `🚀 Discovering new verified businesses (corpLimit=${corpLimit}, ftcLimit=${ftcLimit})...`
  );

  const report = await discoverAndStoreNewBusinesses({
    corpLimit: Number.isFinite(corpLimit) ? corpLimit : 10,
    ftcLimit: Number.isFinite(ftcLimit) ? ftcLimit : 15,
    timeBudgetMs: 120_000,
    delayMs: 150,
  });

  console.log("\n=== DISCOVERY REPORT ===");
  console.log({
    durationMs: report.durationMs,
    corpCursor: `${report.corpCursorBefore} -> ${report.corpCursorAfter}`,
    corpDiscoveredCount: report.corpDiscoveredCount,
    corpWithFinanceCount: report.corpWithFinanceCount,
    corpWithNpsCount: report.corpWithNpsCount,
    ftcLastPageScanned: report.ftcLastPageScanned,
    ftcOffsetAfter: report.ftcOffsetAfter,
    ftcDiscoveredCount: report.ftcDiscoveredCount,
    ftcWithNpsCount: report.ftcWithNpsCount,
    totalInsertedCount: report.totalInsertedCount,
    skippedExistingCount: report.skippedExistingCount,
    skippedInactiveCount: report.skippedInactiveCount,
    timedOutEarly: report.timedOutEarly,
  });

  console.log("\n=== SAMPLES ===");
  for (const s of report.samples) {
    console.log(
      `  [${s.source.toUpperCase()}] ${s.bNo} | ${s.name} | ${s.sector} | start=${s.startDt} | emp=${s.employees} | rev=${s.latestRevenue ?? "-"}`
    );
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
