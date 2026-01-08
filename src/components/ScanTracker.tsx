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
        scanned.current = true;

        // Use keepalive to ensure request completes even if page unloads
        fetch(`/api/scan/${id}`, {
            method: 'POST',
            keepalive: true
        }).catch(console.error);

        if (type === 'link' && destinationUrl) {
            // Redirect after a tick to ensure logic runs
            // window.location.replace(destinationUrl); 
            // Better: use direct assignment, replace is good too.
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
