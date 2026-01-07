# Deployment Guide for Trace-it QR Generator

Since this application uses a local SQLite database (`urls.db`), you have two main options for deployment.

## Option 1: The Easiest Way (Railway or Fly.io)
These platforms allow you to have a "Persistent Volume" (a hard drive that doesn't get deleted), which is perfect for your `urls.db` file.

### Steps for Railway:
1.  **Push your code to GitHub**.
2.  Sign up at [Railway.app](https://railway.app/).
3.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
4.  Select your repository.
5.  **Important**: Go to "Settings" -> "Variables" and add:
    *   `NPM_FLAGS` = `--omit=dev`
6.  Go to "Volumes" and create a volume mounted at `/app` (or wherever the app runs) to persist `urls.db`. *Note: You might need to adjust the `db.ts` path to point to this volume.*

## Option 2: The "Next.js" Way (Vercel + Turso/Neon)
Vercel is the best place to host Next.js, but it **does not support local SQLite files** because it is "Serverless" (the server disappears after it replies).

To use Vercel, you must switch the database to a Cloud Provider.
**Recommendation**: [Turso](https://turso.tech/) (It is SQLite in the cloud, very easy to switch to).

### Steps to Migrate to Vercel:
1.  Create an account on **Turso**.
2.  Create a database and get the `DATABASE_URL` and `AUTH_TOKEN`.
3.  Install the client: `npm install @libsql/client`.
4.  Update `src/lib/db.ts` to connect to Turso instead of `better-sqlite3`.
5.  Push to GitHub.
6.  Import project into **Vercel**.
7.  Add the Environment Variables in Vercel settings.

---

## How to Get & Connect a Custom Domain

### 1. Buy a Domain
You can buy a domain from any registrar. Popular ones include:
*   **Namecheap** (Good prices)
*   **GoDaddy** (Popular)
*   **Cloudflare** (Great for security/speed)

### 2. Connect to Your Deployment
Once you have deployed (e.g., on Vercel or Railway):

**On Vercel:**
1.  Go to your Project -> **Settings** -> **Domains**.
2.  Enter your domain (e.g., `qr.trace-it.io`).
3.  Vercel will give you **DNS Records** (usually a CNAME or A Record).

**On Your Domain Registrar (e.g., Namecheap):**
1.  Log in and go to **DNS Settings** for your domain.
2.  Add the records Vercel gave you.
    *   *Type*: `CNAME`
    *   *Name*: `qr` (if using a subdomain) or `@` (if using the root)
    *   *Value*: `cname.vercel-dns.com`
3.  Wait 5-30 minutes. Vercel will automatically generate an SSL certificate (HTTPS) for you.

### 3. Verify in App
Once connected, your app will be accessible at `https://qr.trace-it.io`.
Any QR code you generate will now use this domain automatically (because the app checks `window.location.origin` or the request headers).
