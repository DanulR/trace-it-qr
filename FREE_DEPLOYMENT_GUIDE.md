# How to Deploy for Free (Forever)

To deploy this app for free, you need two things:
1.  **Hosting**: **Vercel** (Best for Next.js, Free).
2.  **Database**: **Turso** (Cloud SQLite, Free).

**Why Turso?**
Your app currently saves data to a local file (`urls.db`). Vercel is "serverless", meaning it deletes all files when it goes to sleep. You **must** move your database to the cloud. Turso is the easiest way because it is also SQLite.

---

## Step 1: Set up the Database (Turso)
1.  Go to [turso.tech](https://turso.tech/) and sign up (it's free).
2.  Create a new database.
3.  Click "Connect" to get your:
    *   **Database URL** (e.g., `libsql://my-db-name.turso.io`)
    *   **Auth Token** (a long string starting with `ey...`)

## Step 2: Update Your Code
You need to switch from `better-sqlite3` (local) to `@libsql/client` (cloud).

1.  **Install the library**:
    ```bash
    npm install @libsql/client dotenv
    ```

2.  **Update `src/lib/db.ts`**:
    Replace the entire file content with this:

    ```typescript
    import { createClient } from '@libsql/client';

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Helper to run SQL commands
    export async function setupDb() {
      await db.execute(`
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
      `);
    }

    // Call setup on start (or run this manually once)
    setupDb();

    export default db;

    // ... Update other functions to use db.execute() instead of stmt.run()
    // Example:
    // export async function getQRCode(id: string) {
    //   const result = await db.execute({ sql: 'SELECT * FROM qr_codes WHERE id = ?', args: [id] });
    //   return result.rows[0] as unknown as QRCodeData | undefined;
    // }
    ```

## Step 3: Deploy to Vercel
1.  Push your code to a **GitHub Repository**.
2.  Go to [vercel.com](https://vercel.com/) and sign up.
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your GitHub repository.
5.  **Crucial Step**: Under **Environment Variables**, add:
    *   `TURSO_DATABASE_URL`: (Paste your URL from Step 1)
    *   `TURSO_AUTH_TOKEN`: (Paste your Token from Step 1)
6.  Click **Deploy**.

## Step 4: Connect Custom Domain (Free)
1.  In your Vercel Project Dashboard, go to **Settings** -> **Domains**.
2.  Add your domain (e.g., `my-qr-app.com`).
3.  Follow the instructions to update your DNS records at your domain registrar.
