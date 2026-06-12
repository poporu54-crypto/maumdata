const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_GXePATLY0EC4@ep-misty-shape-aqrex525-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function check() {
  try {
    const res = await pool.query("SELECT * FROM businesses WHERE b_no = '1248100998'");
    console.log("Samsung Electronics Full DB data:", res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

check();
