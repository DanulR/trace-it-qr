'use client';

import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link as LinkIcon, QrCode, Copy, Check, ArrowRight, Download, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Basic validation
    let validUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      validUrl = 'https://' + url;
    }

    setLoading(true);
    setError('');
    setShortUrl('');

    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'link',
          title: 'Quick QR ' + new Date().toLocaleTimeString(),
          destination_url: validUrl
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setShortUrl(data.shortUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qrcode.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Dynamic QR Generator</h1>
        <p className={styles.subtitle}>Create trackable QR codes that start with your domain.</p>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <a href="/dashboard" style={{ color: '#818cf8', textDecoration: 'underline' }}>Go to Dashboard</a>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Enter your destination URL (e.g., google.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={styles.input}
              disabled={loading}
              suppressHydrationWarning
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button} disabled={loading || !url}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Generating...
              </>
            ) : (
              <>
                Generate QR Code <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {shortUrl && (
          <div className={styles.result}>
            <div className={styles.qrWrapper} ref={qrRef}>
              <QRCodeCanvas
                value={shortUrl}
                size={200}
                level={'H'}
                includeMargin={true}
                imageSettings={{
                  src: "", // You can add a logo here if needed
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            <div className={styles.linkContainer}>
              <LinkIcon size={16} className="text-slate-400" />
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className={styles.shortLink}>
                {shortUrl}
              </a>
              <button onClick={copyToClipboard} className={styles.copyButton} title="Copy Link">
                {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
              </button>
            </div>

            <button onClick={downloadQRCode} className={styles.button} style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.9rem', background: '#334155' }}>
              <Download size={16} /> Download PNG
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
