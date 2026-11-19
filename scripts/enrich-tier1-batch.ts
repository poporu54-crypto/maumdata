import { runSafeTier1EnrichmentBatch } from "../src/lib/tier1Enricher";
import { pool } from "../src/lib/db";

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 15;
  const refresh = process.argv.includes("--refresh-snapshots");

  console.log(`🚀 Running safe Tier-1 enrichment batch (limit=${limit}, refreshSnapshots=${refresh})...`);
  const report = await runSafeTier1EnrichmentBatch({
    limit: Number.isFinite(limit) ? limit : 15,
    delayMs: 350,
    refreshSnapshots: refresh,
    pruneViewLogs: true,
    pruneBatchSize: 5000,
  });

  console.log("\n=== BATCH REPORT ===");
  console.log({
    durationMs: report.durationMs,
    candidatesCount: report.candidatesCount,
    ntsVerifiedCount: report.ntsVerifiedCount,
    closedMarkedCount: report.closedMarkedCount,
    financeEnrichedCount: report.financeEnrichedCount,
    npsEnrichedCount: report.npsEnrichedCount,
    prunedViewLogsCount: report.prunedViewLogsCount,
    snapshotsRefreshed: report.snapshotsRefreshed,
  });
  console.log("\n=== SAMPLES ===");
  for (const s of report.samples) {
    console.log(
      `  ${s.bNo} | ${s.name.padEnd(20)} | ${s.bStt} | fin=${s.finAdded ? "YES" : "-"} | nps=${s.npsAdded ? "YES" : "-"} | emp=${s.employees} | rev=${s.latestRevenue ?? "-"}`
    );
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
