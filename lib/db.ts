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

export async function getRecentAlerts({ limit = 15, offset = 0, classifier = '', keyword = '', minScore = '', maxScore = '', feed = '' }: {
  limit?: number,
  offset?: number,
  classifier?: string,
  keyword?: string,
  minScore?: string,
  maxScore?: string,
  feed?: string
} = {}) {
  let query = `SELECT timestamp, feed, location, source_url, transcript, keyword, classifier_label, classifier_score, audio_path
    FROM alerts`;
  const params: any[] = [];
  let whereClauses: string[] = [];

  if (classifier) {
    whereClauses.push(`LOWER(classifier_label) = $${params.length + 1}`);
    params.push(classifier.toLowerCase());
  }
  if (feed) {
    whereClauses.push(`feed = $${params.length + 1}`);
    params.push(feed);
  }
  if (keyword) {
    whereClauses.push(`(` +
      `LOWER(keyword) LIKE $${params.length + 1} OR ` +
      `LOWER(transcript) LIKE $${params.length + 2}` +
    `)`);
    params.push(`%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%`);
  }
  if (minScore) {
    whereClauses.push(`classifier_score >= $${params.length + 1}`);
    params.push(Number(minScore));
  }
  if (maxScore) {
    whereClauses.push(`classifier_score <= $${params.length + 1}`);
    params.push(Number(maxScore));
  }
  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }
  query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  return rows.map(row => ({
    ...row,
    timestamp: row.timestamp,
    classifier_score: row.classifier_score !== null ? Number(row.classifier_score) : null
  }));
}

export async function getDistinctFeeds() {
  const { rows } = await pool.query('SELECT DISTINCT feed FROM alerts ORDER BY feed ASC');
  return rows.map(row => row.feed);
}
