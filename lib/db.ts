import { Pool, types } from 'pg'

// Force pg to return timestamps as strings, not Date objects
const TIMESTAMP_OID = 1114; // OID for timestamp (without time zone)
types.setTypeParser(TIMESTAMP_OID, (val: string) => val)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: 'copscannerdb.ccb2m2aue1s7.us-east-1.rds.amazonaws.com',
  port: 5432,
  ssl: { rejectUnauthorized: false }
})

export async function getRecentAlerts() {
  const { rows } = await pool.query(`
    SELECT timestamp, feed, location, source_url, transcript, keyword, classifier_label, classifier_score, audio_path
    FROM alerts
    WHERE timestamp > NOW() - INTERVAL '12 hours'
    ORDER BY timestamp DESC
  `)
  // Return timestamp as-is from the database
  return rows.map(row => ({
    ...row,
    timestamp: row.timestamp
  }))
}
