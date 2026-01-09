'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, QrCode, BarChart2, Calendar, MoreVertical } from 'lucide-react';
import styles from './page.module.css';
import { QRCodePreview, QRStyle } from '@/components/QRCodePreview';

type QRCodeItem = {
    id: string;
    type: 'link' | 'landing' | 'verified_content';
    title: string;
    destination_url?: string;
    scans: number;
    created_at: string;
    folder: string;
    style?: string; // JSON string
    custom_domain?: string;
};

export default function Dashboard() {
    const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadItem, setDownloadItem] = useState<{ item: QRCodeItem, style: QRStyle } | null>(null);

    useEffect(() => {
        fetch('/api/qr')
            .then(res => res.json())
            .then(data => {
                setQrCodes(data);
                setLoading(false);
            })
            .catch(err => {
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

                    const extraHeight = downloadItem.style.labelText
                        ? (qrCanvas.height + (borderPadding * 2) + spaceBetweenBorderAndLabel + labelBoxHeight) - (qrCanvas.height + (padding * 2))
                        : 0;

                    // Recalculate full height to accommodate border and label spacing relative to QR position
                    // Actually, we just need enough space at bottom.
                    // QR is at (padding, padding). Height is qrCanvas.height.
                    // Border goes from padding-borderPadding to padding+height+borderPadding.
                    // Label starts at borderY + borderH + space.

                    const borderH = qrCanvas.height + (borderPadding * 2);
                    const totalContentHeight = (padding - borderPadding) + borderH + spaceBetweenBorderAndLabel + labelBoxHeight + 40; // +40 margin bottom

                    finalCanvas.width = qrCanvas.width + (padding * 2);
                    // Ensure canvas is tall enough. If label exists, use total height calculation
                    finalCanvas.height = downloadItem.style.labelText
                        ? Math.max(qrCanvas.height + (padding * 2), totalContentHeight)
                        : qrCanvas.height + (padding * 2);

                    // 1. Fill white background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

                    // 2. Draw QR Code
                    ctx.drawImage(qrCanvas, padding, padding);

                    // 3. Draw Border & Label if exists
                    if (downloadItem.style.labelText) {
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
                        const textMetrics = ctx.measureText(downloadItem.style.labelText);
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
        }, 500); // 500ms delay to ensure render

        return () => clearTimeout(timer);
    }, [downloadItem]);

    const prepareDownload = (item: QRCodeItem) => {
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

    const getUrl = (qr: QRCodeItem) => {
        if (qr.custom_domain) return `https://${qr.custom_domain}.trace-it.io`;
        // Fallback or standard short URL
        return `${window.location.origin}/${qr.id}`;
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
                        <div key={qr.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.typeBadge}>{qr.type === 'link' ? 'URL' : (qr.type === 'verified_content' ? 'Verified' : 'Page')}</div>
                                <button className={styles.moreBtn}><MoreVertical size={16} /></button>
                            </div>

                            <h3 className={styles.cardTitle}>{qr.title}</h3>
                            <p className={styles.cardUrl}>
                                {qr.type === 'link' ? qr.destination_url : (qr.type === 'verified_content' ? 'Verified Content' : 'Custom Landing Page')}
                            </p>

                            {/* Small preview or style indicator could go here */}

                            <div className={styles.cardStats}>
                                <div className={styles.stat}>
                                    <BarChart2 size={14} /> {qr.scans} scans
                                </div>
                                <div className={styles.stat}>
                                    <Calendar size={14} /> {new Date(qr.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <Link href={`/${qr.id}`} target="_blank" className={styles.actionLink}>
                                    <ExternalLink size={14} /> View
                                </Link>
                                <button
                                    className={styles.downloadBtn}
                                    onClick={() => prepareDownload(qr)}
                                >
                                    <QrCode size={14} /> PNG
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
