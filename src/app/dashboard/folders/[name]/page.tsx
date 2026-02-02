'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, QrCode } from 'lucide-react';
import styles from './page.module.css'; // We'll create this or reuse dashboard styles
// Actually, let's reuse dashboard styles or inline for now as it's simple
// But to match the project structure I should create a module css.
// I will reuse the grid layout from global globals or inline it to save a file for now, 
// or better, I will duplicate the relevant parts of dashboard css.

import { QRCodeCard } from '@/components/QRCodeCard';
import { QRCodeData, Folder } from '@/lib/db';
import { QRCodePreview, QRStyle } from '@/components/QRCodePreview';

// Duplicate basic types if needed or import
export default function FolderViewPage({ params }: { params: Promise<{ name: string }> }) {
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadItem, setDownloadItem] = useState<{ item: QRCodeData, style: QRStyle } | null>(null);
    // State to hold the unwrapped param
    const [folderName, setFolderName] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        // Unwrap params
        params.then(p => {
            const name = decodeURIComponent(p.name);
            setFolderName(name);

            // Move fetch logic here or use another effect dependent on folderName
            Promise.all([
                fetch('/api/qr').then(res => res.json()),
                fetch('/api/folders').then(res => res.json())
            ]).then(([qrs, folderList]) => {
                const filtered = qrs.filter((q: QRCodeData) => q.folder === name);
                setQrCodes(filtered);
                setFolders(folderList);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        });
    }, [params]);

    // Copy download logic from dashboard (unfortunately duplicated logic for now)
    // TODO: move this logic to a hook or context
    useEffect(() => {
        if (!downloadItem) return;
        const timer = setTimeout(() => {
            const qrCanvas = document.getElementById('qr-download-canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                const finalCanvas = document.createElement('canvas');
                const ctx = finalCanvas.getContext('2d');
                if (ctx) {
                    const padding = 100;
                    const labelFontSize = 72;
                    // ... (rest of the detailed canvas drawing logic) ...
                    // For brevity in this thought process, I will simplify or try to extract it?
                    // The user wants it "functional", not necessarily perfect clean code immediately.
                    // Copy-paste is safe.
                    // Actually, I should have extracted this fast logic.
                    // I will replicate the exact logic to ensure consistency.

                    const boxPaddingY = 32;
                    const labelBoxHeight = labelFontSize + (boxPaddingY * 2);
                    const brandColor = '#8B0000';
                    const borderPadding = 20;
                    const borderRadius = 40;
                    const borderThickness = 12;
                    const spaceBetweenBorderAndLabel = 30;

                    const borderH = qrCanvas.height + (borderPadding * 2);
                    const totalContentHeight = (padding - borderPadding) + borderH + spaceBetweenBorderAndLabel + labelBoxHeight + 40;

                    finalCanvas.width = qrCanvas.width + (padding * 2);
                    finalCanvas.height = downloadItem.style.labelText
                        ? Math.max(qrCanvas.height + (padding * 2), totalContentHeight)
                        : qrCanvas.height + (padding * 2);

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                    ctx.drawImage(qrCanvas, padding, padding);

                    if (downloadItem.style.labelText) {
                        ctx.strokeStyle = brandColor;
                        ctx.lineWidth = borderThickness;
                        const borderX = padding - borderPadding;
                        const borderY = padding - borderPadding;
                        const borderW = qrCanvas.width + (borderPadding * 2);

                        // Rounded rect border (simplified path for speed if slightly different, but let's try to match)
                        ctx.beginPath();
                        ctx.moveTo(borderX + borderRadius, borderY);
                        ctx.lineTo(borderX + borderW - borderRadius, borderY);
                        ctx.quadraticCurveTo(borderX + borderW, borderY, borderX + borderW, borderY + borderRadius);
                        ctx.lineTo(borderX + borderW, borderY + borderH - borderRadius);
                        ctx.quadraticCurveTo(borderX + borderW, borderY + borderH, borderX + borderW - borderRadius, borderY + borderH);
                        ctx.lineTo(borderX + borderRadius, borderY + borderH);
                        ctx.quadraticCurveTo(borderX, borderY + borderH, borderX, borderY + borderH - borderRadius);
                        ctx.lineTo(borderX, borderY + borderRadius);
                        ctx.quadraticCurveTo(borderX, borderY, borderX + borderRadius, borderY);
                        ctx.closePath();
                        ctx.stroke();

                        // Label Bubble
                        const centerX = finalCanvas.width / 2;
                        const labelY = borderY + borderH + spaceBetweenBorderAndLabel;
                        ctx.font = `bold ${labelFontSize}px sans-serif`;
                        const textMetrics = ctx.measureText(downloadItem.style.labelText);
                        const textWidth = textMetrics.width;
                        const boxPaddingX = 60;
                        const boxWidth = textWidth + (boxPaddingX * 2);
                        const boxHeight = labelBoxHeight;
                        const radius = 40;
                        const x = centerX - (boxWidth / 2);
                        const y = labelY;

                        ctx.fillStyle = brandColor;
                        ctx.beginPath();
                        ctx.moveTo(x + radius, y);
                        ctx.lineTo(x + boxWidth - radius, y);
                        ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
                        ctx.lineTo(x + boxWidth, y + boxHeight - radius);
                        ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
                        ctx.lineTo(x + radius, y + boxHeight);
                        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
                        ctx.lineTo(x, y + radius);
                        ctx.quadraticCurveTo(x, y, x + radius, y);
                        ctx.closePath();
                        ctx.fill();

                        const pointerWidth = 60;
                        ctx.beginPath();
                        ctx.moveTo(centerX - (pointerWidth / 2), y + 2);
                        ctx.lineTo(centerX, borderY + borderH - (borderThickness / 2) + 2);
                        ctx.lineTo(centerX + (pointerWidth / 2), y + 2);
                        ctx.closePath();
                        ctx.fill();

                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(downloadItem.style.labelText, centerX, y + (boxHeight / 2) + 4);
                    }

                    const link = document.createElement('a');
                    link.download = `${downloadItem.item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
                    link.href = finalCanvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
            setDownloadItem(null);
        }, 500);
        return () => clearTimeout(timer);
    }, [downloadItem]);


    const prepareDownload = (item: QRCodeData) => {
        let style: QRStyle = {
            fgColor: '#000000',
            bgColor: '#ffffff',
            logoImage: '',
            eyeRadius: [0, 0, 0, 0],
            labelText: ''
        };
        if (item.style) {
            try { style = JSON.parse(item.style); } catch (e) { console.error("Failed to parse style", e); }
        }
        setDownloadItem({ item, style });
    };

    const getUrl = (qr: QRCodeData) => `${window.location.origin}/${qr.id}`;

    const handleMove = async (qr: QRCodeData, newFolder: string) => {
        try {
            const res = await fetch(`/api/qr/${qr.id}/folder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder: newFolder })
            });
            if (res.ok) {
                // If we are in "Marketing" and move to "General", it should disappear from this list.
                setQrCodes(prev => prev.filter(q => q.id !== qr.id));
            } else {
                alert('Failed to move QR code');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdate = async (qr: QRCodeData, newTitle: string, newUrl?: string) => {
        try {
            const res = await fetch(`/api/qr/${qr.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    destination_url: newUrl
                })
            });

            if (res.ok) {
                setQrCodes(prev => prev.map(q => {
                    if (q.id === qr.id) {
                        return {
                            ...q,
                            title: newTitle,
                            destination_url: newUrl !== undefined ? newUrl : q.destination_url
                        };
                    }
                    return q;
                }));
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update');
            }
        } catch (e: any) {
            console.error(e);
            throw e; // Re-throw to be handled by Card component
        }
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/dashboard/folders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#64748b' }}>
                    <ArrowLeft size={20} /> Back to Folders
                </Link>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{folderName}</h1>
            </div>

            {/* Hidden Downloader */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: -9999 }}>
                {downloadItem && (
                    <QRCodePreview
                        id="qr-download-canvas"
                        value={getUrl(downloadItem.item)}
                        style={downloadItem.style}
                        size={1000}
                    />
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
            ) : qrCodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                    <QrCode size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                    <h3>Detailed Folder Empty</h3>
                    <p>Move QR codes here to see them.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {qrCodes.map(qr => (
                        <QRCodeCard
                            key={qr.id}
                            qr={qr}
                            onDownload={prepareDownload}
                            onMove={handleMove}
                            onUpdate={handleUpdate}
                            folders={folders}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
