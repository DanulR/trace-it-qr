'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function ScanTracker({
    id,
    type,
    destinationUrl,
    createdAt
}: {
    id: string;
    type: 'link' | 'landing' | 'verified_content';
    destinationUrl?: string;
    createdAt?: string;
}) {
    const [isPreview, setIsPreview] = useState(false);
    const scanned = useRef(false);

    useEffect(() => {
        if (scanned.current) return;

        // 1. Check for Preview Mode
        const searchParams = new URLSearchParams(window.location.search);
        const isPreviewMode = searchParams.get('preview') === 'true';

        if (isPreviewMode) {
            setIsPreview(true);
            return; // Do not count previews
        }

        // 2. Client-Side Debounce (1 minute)
        const storageKey = `scanned_${id}`;
        const lastScan = localStorage.getItem(storageKey);
        const now = Date.now();

        if (lastScan && (now - parseInt(lastScan)) < 60000) {
            return; // Scanned recently, ignore
        }

        scanned.current = true;
        localStorage.setItem(storageKey, now.toString());

        // Use keepalive to ensure request completes even if page unloads
        fetch(`/api/scan/${id}`, {
            method: 'POST',
            keepalive: true
        }).catch(console.error);

        // Auto-redirect removed to show the intermediate page
    }, [id, type, destinationUrl]);

    if (type === 'link') {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontFamily: 'sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    width: '100%',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    padding: '1rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 'bold'
                }}>
                    <ShieldCheck size={24} />
                    SECURE LINK
                </div>

                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}>
                    {/* Status Card */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#64748b'
                        }}>
                            <LinkIcon size={40} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Redirect Target
                        </h1>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}>
                            <ShieldCheck size={14} /> Safe Link
                        </div>
                    </div>

                    {/* Content Details Card */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>
                            Content Details
                        </h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                                <p style={{ fontWeight: '500' }}>External Link</p>
                            </div>
                            {createdAt && (
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Published Date</label>
                                    <p style={{ fontWeight: '500' }}>{new Date(createdAt).toLocaleDateString()}</p>
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination</label>
                                <p style={{
                                    fontFamily: 'monospace',
                                    background: '#f1f5f9',
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.9rem',
                                    wordBreak: 'break-all',
                                    marginTop: '0.25rem'
                                }}>
                                    {destinationUrl || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                            {destinationUrl && (
                                <a
                                    href={destinationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        backgroundColor: '#0f172a',
                                        color: 'white',
                                        textAlign: 'center',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        textDecoration: 'none',
                                        fontWeight: '600'
                                    }}
                                >
                                    View Original Content
                                </a>
                            )}
                            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                                You will be redirected to the external source.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', padding: '2rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Powered by Trace-it Verification System
                </div>
            </div>
        );
    }

    return null;
}
