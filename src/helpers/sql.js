const postgres = require("postgres");
require("dotenv").config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const sql = postgres({
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  database: "postgres",
  username: "postgres.msobruktbtmzmynnexrh",
  password: "8sLb6nPED@Rx@dp",
  port: 6543,
  // ssl: "require",
  // connection: {
  //   options: `project=${ENDPOINT_ID}`,
  // },
});


module.exports = sql;
