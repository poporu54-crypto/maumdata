import { getDirectoryOverview } from "../src/lib/directoryApi";
import { query, pool } from "../src/lib/db";

async function main() {
  const t0 = Date.now();
  // Force fresh rebuild by clearing overview key first so all 37 hub snapshots + overview are freshly seeded
  await query(`DELETE FROM public.system_settings WHERE key = 'directory_overview_v1'`);
  const overview = await getDirectoryOverview();
  const elapsed = Date.now() - t0;

  console.log(`✅ Seeded all snapshots in ${elapsed}ms!`);
  console.log("=== GLOBAL SUMMARY ===", overview.globalSummary);

  console.log(`\n=== RANKING HUBS (${overview.rankingHubs.length}) ===`);
  for (const h of overview.rankingHubs) {
    console.log(
      `  ${h.slug.padEnd(18)} | ${String(h.companyCount).padStart(5)}개사 | avgSal=${String(h.avgSalaryManwon || "-").padStart(5)}만원 | top1=${h.sampleCompanies[0]?.name} (${h.sampleCompanies[0]?.metricText})`
    );
  }

  console.log(`\n=== REGION HUBS (${overview.regionHubs.length}) ===`);
  for (const h of overview.regionHubs) {
    console.log(
      `  ${h.slug.padEnd(24)} | ${String(h.companyCount).padStart(5)}개사 | emp=${String(h.totalEmployees).padStart(7)}명 | top1=${h.sampleCompanies[0]?.name}`
    );
  }

  console.log(`\n=== INDUSTRY HUBS (${overview.industryHubs.length}) ===`);
  for (const h of overview.industryHubs) {
    console.log(
      `  ${h.slug.padEnd(28)} | ${String(h.companyCount).padStart(5)}개사 | emp=${String(h.totalEmployees).padStart(7)}명 | top1=${h.sampleCompanies[0]?.name}`
    );
  }

  const snapCnt = await query(`SELECT COUNT(*)::int AS cnt FROM public.system_settings WHERE key LIKE 'directory_%'`);
  console.log("\nTotal directory snapshots in system_settings:", snapCnt.rows[0].cnt);

  const exp = await query(
    `EXPLAIN (ANALYZE, BUFFERS) SELECT value, updated_at FROM public.system_settings WHERE key = 'directory_overview_v1' LIMIT 1`
  );
  console.log("\n=== PK SNAPSHOT EXPLAIN ANALYZE ===");
  console.log(exp.rows.map((r: any) => r["QUERY PLAN"]).join("\n"));

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
