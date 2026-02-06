
import { createClient } from './supabase/server'; // Server-side client
import { createClient as createBrowserClient } from './supabase/client'; // Client-side client
import { nanoid } from 'nanoid';

// Database Types
export type QRCodeData = {
  id: string;
  user_id: string;
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

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

// HELPER: Get correct client based on environment
async function getDB() {
  if (typeof window === 'undefined') {
    // Server environment
    return await createClient();
  } else {
    // Browser environment
    return createBrowserClient();
  }
}

// MIGRATION HELPER: Replaces local SQL init
export async function initDB() {
  // Supabase tables are created via SQL Editor/Migrations, not here.
  // We can leave this empty or check connection.
  console.log("DB Init: Using Supabase (Tables managed via SQL Editor)");
}

// ----------------------------------------------------------------------
// QR CODE OPERATIONS
// ----------------------------------------------------------------------

export async function createQRCode(data: Partial<QRCodeData>) {
  const supabase = await getDB();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const newQR = {
    id: data.id || nanoid(8),
    user_id: user.id,
    type: data.type || 'link',
    title: data.title,
    destination_url: data.destination_url,
    landing_content: data.landing_content,
    folder: data.folder || 'General',
    custom_domain: data.custom_domain,
    organization: data.organization,
    content_category: data.content_category,
    verification_hash: data.verification_hash,
    style: data.style,
  };

  const { error } = await supabase
    .from('qr_codes')
    .insert(newQR);

  if (error) {
    console.error("Supabase Create Error:", error);
    throw new Error(error.message);
  }

  return newQR;
}

export async function getQRCode(id: string) {
  const supabase = await getDB();
  // We use .select().single()
  // RLS will ensure user only sees their own, OR public ones?
  // User asked for "different users", implying isolation.
  // But for "scanning", the QR must be public?
  // Actually, `getQRCode` is likely used by the Dashboard (edit mode) AND the Redirect logic.
  // If Redirect logic uses this, it needs Admin/Service key OR 'public' RLS policy for reading by ID.
  // For now, let's assume this is Dashboard usage (User context).
  // If it's used for redirection, we might need a separate function using Service Key or public table.

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return undefined;
  return data as QRCodeData;
}

export async function getPublicQRCode(id: string) {
  const supabase = await getDB();

  // Use RPC (Security Definer Function) to bypass RLS for public access
  const { data, error } = await supabase
    .rpc('get_public_qr', { p_id: id });

  if (error || !data) return undefined;

  // RPC returns array or single object depending on definition, usually single JSON or row
  // If defined as returns setof qr_codes, we get array. If returns qr_codes, single.
  // We'll assume the SQL definition returns a single row or null.
  // Actually, standard rpc returns data as is.
  // If the function returns "setof", it's an array.
  // We will write the SQL to return "SETOF qr_codes" and take the first one.

  if (Array.isArray(data)) {
    return data[0] as QRCodeData;
  }
  return data as QRCodeData;
}

export async function getAllQRCodes() {
  const supabase = await getDB();

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase Get All Error:", error);
    return [];
  }
  return data as QRCodeData[];
}

export async function incrementScan(id: string) {
  const supabase = await getDB();
  // RPC or simple update?
  // Simple update is fine, but concurrency might represent a race condition.
  // Better to use RPC if possible, but let's stick to simple first.

  // WARNING: This requires UPDATE permission. If RLS restricts UPDATE to owner,
  // then anonymous scanners cannot increment scan count!
  // We need a Postgres Function (RPC) `increment_scan(qr_id)` marked as SECURITY DEFINER
  // to allow anonymous updates to scan count.

  try {
    const { error } = await supabase.rpc('increment_scan_count', { qr_id: id });
    if (error) {
      // Fallback or ignore
      console.warn("Scan increment failed:", error.message);
    }
  } catch (e) {
    console.error("Scan Increment Error", e);
  }
}

export async function updateQRCode(id: string, updates: Partial<QRCodeData>) {
  const supabase = await getDB();

  // Filter allowed fields
  const allowedFields = ['title', 'destination_url', 'landing_content', 'folder', 'style', 'custom_domain'];
  const cleanUpdates: any = {};

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      cleanUpdates[key] = (updates as any)[key];
    }
  });

  const { error } = await supabase
    .from('qr_codes')
    .update(cleanUpdates)
    .eq('id', id);

  if (error) throw new Error(error.message);
}


// ----------------------------------------------------------------------
// FOLDER OPERATIONS
// ----------------------------------------------------------------------

export async function initFoldersDB() {
  // Supabase init handled externally
}

export async function createFolder(name: string) {
  const supabase = await getDB();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = nanoid(6);

  const { error } = await supabase
    .from('folders')
    .insert({
      id,
      user_id: user.id,
      name
    });

  if (error) throw new Error(error.message);
}

export async function getFolders() {
  const supabase = await getDB();

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return [];
  return data as Folder[];
}

export async function deleteFolder(name: string) {
  if (name === 'General') throw new Error("Cannot delete General folder");
  const supabase = await getDB();

  // 1. Move QRs to General
  // We can't batch these easily without a procedure, but 2 calls is fine.

  // Get User ID for data safety
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error: moveError } = await supabase
    .from('qr_codes')
    .update({ folder: 'General' })
    .eq('folder', name)
    .eq('user_id', user.id); // Redundant if RLS, but safe.

  if (moveError) throw new Error(moveError.message);

  // 2. Delete Folder
  const { error: deleteError } = await supabase
    .from('folders')
    .delete()
    .eq('name', name)
    .eq('user_id', user.id);

  if (deleteError) throw new Error(deleteError.message);
}

export async function updateQRFolder(qrId: string, folderName: string) {
  const supabase = await getDB();

  const { error } = await supabase
    .from('qr_codes')
    .update({ folder: folderName })
    .eq('id', qrId);

  if (error) throw new Error(error.message);
}
