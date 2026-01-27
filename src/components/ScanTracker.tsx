'use client';

import { useEffect, useRef } from 'react';

export default function ScanTracker({
    id,
    type,
    destinationUrl
}: {
    id: string;
    type: 'link' | 'landing' | 'verified_content';
    destinationUrl?: string;
}) {
    const scanned = useRef(false);

    useEffect(() => {
        if (scanned.current) return;

        // 1. Check for Preview Mode
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('preview') === 'true') {
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

        if (type === 'link' && destinationUrl) {
            // Redirect after a tick to ensure logic runs
            window.location.href = destinationUrl;
        }
    }, [id, type, destinationUrl]);

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
