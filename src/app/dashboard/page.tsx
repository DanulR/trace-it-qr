'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, QrCode, BarChart2, Calendar, MoreVertical } from 'lucide-react';
import styles from './page.module.css';
import { QRCodePreview, QRStyle } from '@/components/QRCodePreview';
import { QRCodeCard } from '@/components/QRCodeCard';
import { QRCodeData, Folder } from '@/lib/db';

export default function Dashboard() {
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadItem, setDownloadItem] = useState<{ item: QRCodeData, style: QRStyle } | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/qr').then(res => res.json()),
            fetch('/api/folders').then(res => res.json())
        ]).then(([qrData, folderData]) => {
            setQrCodes(qrData);
            setFolders(folderData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    // Handle download effect
    useEffect(() => {
        if (!downloadItem) return;

        // Wait for render (and potential image load)
        const timer = setTimeout(() => {
            const qrCanvas = document.getElementById('qr-download-canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                // Create a temporary canvas for composition
                const finalCanvas = document.createElement('canvas');
                const ctx = finalCanvas.getContext('2d');

                if (ctx) {
                    const padding = 100; // Increased padding to make QR look smaller relative to canvas
                    const labelFontSize = 72; // Increased font size
                    const labelMargin = 30;

                    // Box calculations based on new font size
                    const boxPaddingY = 32;
                    const labelBoxHeight = labelFontSize + (boxPaddingY * 2);

                    const brandColor = '#8B0000';
                    const borderPadding = 20; // Space between QR and border
                    const borderRadius = 40;
                    const borderThickness = 12;
                    const spaceBetweenBorderAndLabel = 30;

                    let styleObj: QRStyle;
                    if (downloadItem.style) {
                        // Should be object already if typed correctly but let's be safe
                        styleObj = typeof downloadItem.style === 'string' ? JSON.parse(downloadItem.style) : downloadItem.style as any;
                    } else {
                        // Default dummy
                        styleObj = { labelText: '', fgColor: '#000', bgColor: '#fff', eyeRadius: [0, 0, 0, 0], logoImage: '' };
                    }


                    const extraHeight = styleObj.labelText
                        ? (qrCanvas.height + (borderPadding * 2) + spaceBetweenBorderAndLabel + labelBoxHeight) - (qrCanvas.height + (padding * 2))
                        : 0;

                    const borderH = qrCanvas.height + (borderPadding * 2);
                    const totalContentHeight = (padding - borderPadding) + borderH + spaceBetweenBorderAndLabel + labelBoxHeight + 40; // +40 margin bottom

                    finalCanvas.width = qrCanvas.width + (padding * 2);
                    // Ensure canvas is tall enough. If label exists, use total height calculation
                    finalCanvas.height = styleObj.labelText
                        ? Math.max(qrCanvas.height + (padding * 2), totalContentHeight)
                        : qrCanvas.height + (padding * 2);

                    // 1. Fill white background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

                    // 2. Draw QR Code
                    ctx.drawImage(qrCanvas, padding, padding);

                    // 3. Draw Border & Label if exists
                    if (styleObj.labelText) {
                        // Draw Rounded Border around QR
                        ctx.strokeStyle = brandColor;
                        ctx.lineWidth = borderThickness;

                        const borderX = padding - borderPadding;
                        const borderY = padding - borderPadding;
                        // Width is QR width + padding on both sides
                        const borderW = qrCanvas.width + (borderPadding * 2);

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

                        // Label Calculations
                        const centerX = finalCanvas.width / 2;
                        const labelY = borderY + borderH + spaceBetweenBorderAndLabel;

                        ctx.font = `bold ${labelFontSize}px sans-serif`;
                        const textMetrics = ctx.measureText(styleObj.labelText);
                        const textWidth = textMetrics.width;
                        const boxPaddingX = 60; // Wider bubble

                        const boxWidth = textWidth + (boxPaddingX * 2);
                        const boxHeight = labelBoxHeight;

                        // Draw Bubble Background (Rounded Rect)
                        ctx.fillStyle = brandColor;
                        const radius = 40; // Larger radius
                        const x = centerX - (boxWidth / 2);
                        const y = labelY;

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

                        // Draw Wide Triangle Connection (merging border and label)
                        const pointerWidth = 60;
                        ctx.beginPath();
                        // Point on the label top
                        ctx.moveTo(centerX - (pointerWidth / 2), y + 2);
                        // Point connecting to QR border bottom
                        ctx.lineTo(centerX, borderY + borderH - (borderThickness / 2) + 2); // 12 is borderThickness hardcoded or use var
                        // Point on label top right
                        ctx.lineTo(centerX + (pointerWidth / 2), y + 2);
                        ctx.closePath();
                        ctx.fill();

                        // Draw Text
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        // Adjust text Y slightly to center in the visual mass of the bubble
                        ctx.fillText(styleObj.labelText, centerX, y + (boxHeight / 2) + 4);
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
        }, 500); // 500ms delay to ensure render

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
            try {
                style = JSON.parse(item.style);
            } catch (e) {
                console.error("Failed to parse style", e);
            }
        }

        setDownloadItem({ item, style });
    };

    const getUrl = (qr: QRCodeData) => {
        // Always return the standard app specific URL
        return `${window.location.origin}/${qr.id}`;
    };

    const handleMove = async (qr: QRCodeData, newFolder: string) => {
        try {
            const res = await fetch(`/api/qr/${qr.id}/folder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder: newFolder })
            });
            if (res.ok) {
                // Update local state to reflect change (optimistic or re-fetch)
                setQrCodes(prev => prev.map(q => q.id === qr.id ? { ...q, folder: newFolder } : q));
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
        <div>
            <div className={styles.headerAction}>
                <h1 className={styles.pageTitle}>My QR Codes</h1>
                <Link href="/dashboard/create" className={styles.createBtn}>
                    <Plus size={20} /> Create QR Code
                </Link>
            </div>

            {/* Hidden Downloader */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: -9999 }}>
                {downloadItem && (
                    <QRCodePreview
                        id="qr-download-canvas"
                        value={getUrl(downloadItem.item)}
                        style={downloadItem.style}
                        size={1000} // High res for download
                    />
                )}
            </div>

            {loading ? (
                <div className={styles.loading}>Loading...</div>
            ) : qrCodes.length === 0 ? (
                <div className={styles.emptyState}>
                    <QrCode size={48} className={styles.emptyIcon} />
                    <h3>No QR Codes yet</h3>
                    <p>Create your first dynamic QR code to get started.</p>
                    <Link href="/dashboard/create" className={styles.createBtn}>
                        Create Now
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
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
