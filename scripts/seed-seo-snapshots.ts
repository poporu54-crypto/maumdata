import { rebuildAllSeoFeedSnapshots } from "../src/lib/seoFeeds";
import { pool, query } from "../src/lib/db";

async function main() {
  const started = Date.now();
  console.log("🚀 Seeding 24h SEO feed snapshots (sitemaps + RSS) into system_settings...");
  const counts = await rebuildAllSeoFeedSnapshots();
  console.log("✅ Seeded counts:", counts, `in ${Date.now() - started}ms`);

  const check = await query(
    `SELECT key, pg_column_size(value) AS bytes, updated_at
     FROM public.system_settings
     WHERE key LIKE 'seo_feed_v1:%'
     ORDER BY key`
  );
  console.table(check.rows);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
