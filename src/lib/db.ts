import { createClient } from '@libsql/client';
import path from 'path';

// Check if we are in production with Turso
const useTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

let db: any;

if (useTurso) {
  // Production: Use Turso
  db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
} else {
  // Development: Lazy load better-sqlite3 to avoid deployment issues
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(process.cwd(), 'urls.db');
    db = new Database(dbPath);
  } catch (e) {
    console.warn('better-sqlite3 not available, some features may not work in dev');
  }
}

export default db;

export type QRCodeData = {
  id: string;
  type: 'link' | 'landing' | 'verified_content';
  title: string;
  destination_url?: string;
  landing_content?: string;
  folder?: string;
  custom_domain?: string;
  organization?: string;
  content_category?: string;
  verification_hash?: string;
  created_at: string;
  scans: number;
};

// Helper to handle both Better-SQLite3 (sync) and LibSQL (async)
async function runQuery(query: string, args: any = []) {
  if (useTurso) {
    return await db.execute({ sql: query, args });
  } else {
    const stmt = db.prepare(query);
    // better-sqlite3 uses named parameters like @id, but libsql uses ? or :id
    // We need to standardize. For now, let's assume the input 'args' matches the query format.
    // However, our previous code used @named params. LibSQL supports named params with : or @.
    // Let's try to pass the object directly.
    return stmt.run(args);
  }
}

async function getQuery(query: string, args: any = []) {
  if (useTurso) {
    const result = await db.execute({ sql: query, args });
    return result.rows[0];
  } else {
    const stmt = db.prepare(query);
    return stmt.get(args);
  }
}

async function allQuery(query: string, args: any = []) {
  if (useTurso) {
    const result = await db.execute({ sql: query, args });
    return result.rows;
  } else {
    const stmt = db.prepare(query);
    return stmt.all(args);
  }
}

// Initialize DB (Safe to run multiple times)
const initQuery = `
  CREATE TABLE IF NOT EXISTS qr_codes (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('link', 'landing', 'verified_content')) NOT NULL DEFAULT 'link',
    title TEXT,
    destination_url TEXT,
    landing_content TEXT,
    folder TEXT DEFAULT 'General',
    custom_domain TEXT,
    organization TEXT,
    content_category TEXT,
    verification_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    scans INTEGER DEFAULT 0
  )
`;

export async function initDB() {
  if (useTurso) {
    try {
      await db.execute({ sql: initQuery, args: [] });
    } catch (err) {
      console.error("Failed to init Turso DB", err);
    }
  } else {
    db.exec(initQuery);
  }
}

// Call init on load, but we also export it to await it in API routes
initDB();


export async function createQRCode(data: Partial<QRCodeData>) {
  // Use positional parameters to be 100% safe with types
  const query = `
    INSERT INTO qr_codes (id, type, title, destination_url, landing_content, folder, custom_domain, organization, content_category, verification_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const args = [
    data.id || '',  // Required, use empty string  
    data.type || 'link',  // Required with default
    data.title || '',  // Required, use empty string
    data.destination_url || null,  // Optional, use null
    data.landing_content || null,  // Optional, use null
    data.folder || 'General',  // Required with default
    data.custom_domain || null,  // Optional, use null
    data.organization || null,  // Optional, use null
    data.content_category || null,  // Optional, use null
    data.verification_hash || null  // Optional, use null
  ];

  if (useTurso) {
    console.log('[DB] About to execute with args:', JSON.stringify(args));
    console.log('[DB] Args types:', args.map((a, i) => `${i}:${typeof a}`).join(', '));
    try {
      return await db.execute({ sql: query, args });
    } catch (e: any) {
      console.error("Turso Execute Error Args:", JSON.stringify(args));
      throw new Error(`Turso Error: ${e.message} | Args: ${JSON.stringify(args)}`);
    }
  } else {
    // For better-sqlite3 with positional args, we use run(...args)
    const stmt = db.prepare(query);
    return stmt.run(...args);
  }
}

export async function getQRCode(id: string) {
  // For positional params (?)
  if (useTurso) {
    const result = await db.execute({ sql: 'SELECT * FROM qr_codes WHERE id = ?', args: [id] });
    return result.rows[0] as unknown as QRCodeData | undefined;
  } else {
    const stmt = db.prepare('SELECT * FROM qr_codes WHERE id = ?');
    return stmt.get(id) as QRCodeData | undefined;
  }
}

export async function getAllQRCodes() {
  if (useTurso) {
    const result = await db.execute('SELECT * FROM qr_codes ORDER BY created_at DESC');
    return result.rows as unknown as QRCodeData[];
  } else {
    const stmt = db.prepare('SELECT * FROM qr_codes ORDER BY created_at DESC');
    return stmt.all() as QRCodeData[];
  }
}

export async function incrementScan(id: string) {
  if (useTurso) {
    return await db.execute({ sql: 'UPDATE qr_codes SET scans = scans + 1 WHERE id = ?', args: [id] });
  } else {
    const stmt = db.prepare('UPDATE qr_codes SET scans = scans + 1 WHERE id = ?');
    return stmt.run(id);
  }
}
