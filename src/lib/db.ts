import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';

// Check if we are in a cloud environment (Vercel) or have Turso credentials
const useTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

let db: any;

if (useTurso) {
  db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
} else {
  // Fallback to local SQLite for development if no Turso creds
  const dbPath = path.join(process.cwd(), 'urls.db');
  db = new Database(dbPath);
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

if (useTurso) {
  // We can't await at top level easily in CommonJS/ESM mix without top-level await support
  // But Next.js supports it.
  db.execute(initQuery).catch((err: any) => console.error("Failed to init Turso DB", err));
} else {
  db.exec(initQuery);
}


export async function createQRCode(data: Partial<QRCodeData>) {
  const query = `
    INSERT INTO qr_codes (id, type, title, destination_url, landing_content, folder, custom_domain, organization, content_category, verification_hash)
    VALUES (:id, :type, :title, :destination_url, :landing_content, :folder, :custom_domain, :organization, :content_category, :verification_hash)
  `;

  // Better-sqlite3 uses @, LibSQL uses : or @. Let's use : for compatibility if we switch, 
  // but actually better-sqlite3 supports @, $, :. 
  // Let's stick to the object keys matching the parameters.

  // We need to ensure data keys match the query params.
  // If we use @id in query, data must have key 'id'.

  // Let's update the query to use @ which works for both (usually)
  const queryCompatible = `
    INSERT INTO qr_codes (id, type, title, destination_url, landing_content, folder, custom_domain, organization, content_category, verification_hash)
    VALUES (@id, @type, @title, @destination_url, @landing_content, @folder, @custom_domain, @organization, @content_category, @verification_hash)
  `;

  if (useTurso) {
    return await db.execute({ sql: queryCompatible, args: data });
  } else {
    const stmt = db.prepare(queryCompatible);
    return stmt.run(data);
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
