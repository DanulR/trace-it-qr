'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function ScanTracker({
    id,
    type,
    destinationUrl
}: {
    id: string;
    type: 'link' | 'landing' | 'verified_content';
    destinationUrl?: string;
}) {
    const [isPreview, setIsPreview] = useState(false);
    const scanned = useRef(false);

    useEffect(() => {
        if (scanned.current) return;

        // 1. Check for Preview Mode
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('preview') === 'true') {
            setIsPreview(true);
            return; // Do not count previews or redirect
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

        if (type === 'link' && destinationUrl) {
            // Redirect after a tick to ensure logic runs
            window.location.href = destinationUrl;
        }
    }, [id, type, destinationUrl]);

    if (isPreview && type === 'link') {
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
                    LINK PREVIEW
                </div>

                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}>
                    {/* Main Card */}
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
                            <ShieldCheck size={14} /> Safe Preview
                        </div>

                        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination URL</label>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '0.5rem',
                                marginTop: '0.5rem',
                                wordBreak: 'break-all',
                                fontSize: '0.9rem',
                                fontFamily: 'monospace',
                                border: '1px solid #e2e8f0'
                            }}>
                                {destinationUrl || 'No destination URL configured'}
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            {destinationUrl && (
                                <a
                                    href={destinationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        backgroundColor: '#0f172a',
                                        color: 'white',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        transition: 'opacity 0.2s'
                                    }}
                                >
                                    Visit Link <ExternalLink size={16} style={{ marginLeft: '8px' }} />
                                </a>
                            )}
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                            This scan is not counted in analytics.
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', padding: '2rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Powered by Trace-it Verification System
                </div>
            </div>
        );
    }

    if (type === 'link') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'sans-serif',
                color: '#666'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                }}></div>
                <p>Redirecting...</p>
                <style jsx global>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return null;
}
