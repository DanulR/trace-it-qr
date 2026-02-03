'use client';

import { useEffect, useRef, useState } from 'react';

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
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'sans-serif',
                padding: '2rem',
                backgroundColor: '#f8fafc',
                color: '#334155'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'inline-block',
                        marginBottom: '1.5rem'
                    }}>
                        PREVIEW MODE
                    </div>

                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>Redirect Destination</h1>

                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        wordBreak: 'break-all',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace'
                    }}>
                        {destinationUrl || 'No destination URL configured'}
                    </div>

                    {destinationUrl && (
                        <a
                            href={destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Visit Link
                        </a>
                    )}
                </div>
                <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
                    This scan will not be counted.
                </p>
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
