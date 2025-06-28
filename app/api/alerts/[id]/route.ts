import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alertId = parseInt(id, 10);
    
    if (isNaN(alertId)) {
      return NextResponse.json({ error: 'Invalid alert ID' }, { status: 400 });
    }

    const query = `
      SELECT id, timestamp, feed, location, source_url, transcript, keyword, 
             classifier_label, classifier_score, audio_path
      FROM alerts 
      WHERE id = $1
    `;
    
    const { rows } = await pool.query(query, [alertId]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = {
      ...rows[0],
      classifier_score: rows[0].classifier_score !== null ? Number(rows[0].classifier_score) : null
    };

    return NextResponse.json(alert);
  } catch (error) {
    console.error('API /api/alerts/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
