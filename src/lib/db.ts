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
  style?: string; // JSON string for customization
  created_at: string;
  scans: number;
};

// Helper to handle both Better-SQLite3 (sync) and LibSQL (async)
async function runQuery(query: string, args: any = []) {
  if (useTurso) {
    return await db.execute({ sql: query, args });
  } else {
    const stmt = db.prepare(query);
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
    style TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    scans INTEGER DEFAULT 0
  )
`;

export async function initDB() {
  if (useTurso) {
    try {
      await db.execute({ sql: initQuery, args: [] });
      try {
        await db.execute({ sql: 'ALTER TABLE qr_codes ADD COLUMN style TEXT', args: [] });
      } catch (e) { /* ignore if exists */ }
    } catch (err) {
      console.error("Failed to init Turso DB", err);
    }
  } else {
    db.exec(initQuery);
    try {
      db.exec('ALTER TABLE qr_codes ADD COLUMN style TEXT');
    } catch (e) { /* ignore if already exists */ }
  }
}

// Call init on load, but we also export it to await it in API routes
initDB();


export async function createQRCode(data: Partial<QRCodeData>) {
  // Manual escaping helper to bypass parameter binding issues entirely
  const escape = (val: string | null | undefined) => {
    if (val === null || val === undefined) return 'NULL';
    // Replace single quotes with two single quotes
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const idVal = escape(data.id);
  const typeVal = escape(data.type || 'link');
  const titleVal = escape(data.title);
  const destVal = escape(data.destination_url);
  const landingVal = escape(data.landing_content);
  const folderVal = escape(data.folder || 'General');
  const domainVal = escape(data.custom_domain);
  const orgVal = escape(data.organization);
  const catVal = escape(data.content_category);
  const hashVal = escape(data.verification_hash);
  const styleVal = escape(data.style);

  const query = `
    INSERT INTO qr_codes (id, type, title, destination_url, landing_content, folder, custom_domain, organization, content_category, verification_hash, style)
    VALUES (${idVal}, ${typeVal}, ${titleVal}, ${destVal}, ${landingVal}, ${folderVal}, ${domainVal}, ${orgVal}, ${catVal}, ${hashVal}, ${styleVal})
  `;

  if (useTurso) {
    console.log('[DB] Executing inlined query');
    try {
      return await db.execute({ sql: query, args: [] });
    } catch (e: any) {
      console.error("Turso Execute Error:", e.message);
      throw new Error(`Turso Error: ${e.message}`);
    }
  } else {
    // Local dev fallback
    return db.prepare(query).run();
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

// ----------------------------------------------------------------------
// FOLDER OPERATIONS
// ----------------------------------------------------------------------

export type Folder = {
  id: string;
  name: string;
  created_at: string;
};

// Ensure folders table exists
const initFoldersQuery = `
  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Run this separately or inside initDB
async function initFoldersDB() {
  if (useTurso) {
    try {
      await db.execute({ sql: initFoldersQuery, args: [] });
      // Insert default 'General' folder if not exists
      try {
        await db.execute({
          sql: "INSERT INTO folders (id, name) VALUES ('default_general', 'General')",
          args: []
        });
      } catch (e) { /* ignore constraint error */ }
    } catch (err) {
      console.error("Failed to init Folders table", err);
    }
  } else {
    db.exec(initFoldersQuery);
    try {
      db.prepare("INSERT INTO folders (id, name) VALUES ('default_general', 'General')").run();
    } catch (e) { /* ignore */ }
  }
}

// We can append this to initDB, or just call it here.
// Let's modify initDB to call this.
// BUT since I can't easily modify initDB in this contiguous block without re-writing the whole file or using multi-replace (which is disallowed for single block), 
// I will just export it and call it. 
// Actually, I can just run it once at module level like initDB is run.
initFoldersDB();


export async function createFolder(name: string) {
  const id = require('nanoid').nanoid(6);
  // Escape name for safety if local
  const escape = (val: string) => `'${val.replace(/'/g, "''")}'`;

  // We need to handle potential duplicate name error
  const query = `INSERT INTO folders (id, name) VALUES ('${id}', ${escape(name)})`;

  if (useTurso) {
    return await db.execute({ sql: `INSERT INTO folders (id, name) VALUES (?, ?)`, args: [id, name] });
  } else {
    return db.prepare('INSERT INTO folders (id, name) VALUES (?, ?)').run(id, name);
  }
}

export async function getFolders() {
  if (useTurso) {
    const result = await db.execute('SELECT * FROM folders ORDER BY created_at ASC');
    return result.rows as unknown as Folder[];
  } else {
    return db.prepare('SELECT * FROM folders ORDER BY created_at ASC').all() as Folder[];
  }
}

export async function deleteFolder(name: string) {
  // Prevent deleting 'General'
  if (name === 'General') throw new Error("Cannot delete General folder");

  // 1. Move QRs to General
  const moveQuery = `UPDATE qr_codes SET folder = 'General' WHERE folder = ?`;
  // 2. Delete Folder
  const deleteQuery = `DELETE FROM folders WHERE name = ?`;

  if (useTurso) {
    await db.execute({ sql: moveQuery, args: [name] });
    await db.execute({ sql: deleteQuery, args: [name] });
  } else {
    db.transaction(() => {
      db.prepare(moveQuery).run(name);
      db.prepare(deleteQuery).run(name);
    })();
  }
}

export async function updateQRFolder(qrId: string, folderName: string) {
  if (useTurso) {
    return await db.execute({ sql: 'UPDATE qr_codes SET folder = ? WHERE id = ?', args: [folderName, qrId] });
  } else {
    return db.prepare('UPDATE qr_codes SET folder = ? WHERE id = ?').run(folderName, qrId);
  }
}
