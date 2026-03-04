'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, QrCode, BarChart2, Calendar, MoreVertical } from 'lucide-react';
import styles from './page.module.css';
import { QRCodePreview, QRStyle } from '@/components/QRCodePreview';
import { QRCodeCard } from '@/components/QRCodeCard';
import { createQRCompositeCanvas } from '@/lib/qr-canvas';
import { QRCodeData, Folder } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

export default function Dashboard() {
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadItem, setDownloadItem] = useState<{ item: QRCodeData, style: QRStyle } | null>(null);
    const [embedItem, setEmbedItem] = useState<{ item: QRCodeData, style: QRStyle, file: File } | null>(null);
    const [userStyle, setUserStyle] = useState<Partial<QRStyle> | null>(null);
    const supabase = createClient();

    useEffect(() => {
        // Load user metadata style
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.user_metadata?.style) {
                const s = { ...user.user_metadata.style };
                if (s.cornerStyle === 'rounded') {
                    s.eyeRadius = [10, 10, 10, 10];
                } else if (s.cornerStyle === 'square') {
                    s.eyeRadius = [0, 0, 0, 0];
                }
                setUserStyle(s);
            }
        });

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

        const timer = setTimeout(() => {
            const qrCanvas = document.getElementById('qr-download-canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                let styleObj: QRStyle;
                if (downloadItem.style) {
                    styleObj = typeof downloadItem.style === 'string' ? JSON.parse(downloadItem.style) : downloadItem.style as any;
                } else {
                    styleObj = { labelText: '', fgColor: '#000', bgColor: '#fff', eyeRadius: [0, 0, 0, 0], logoImage: '' };
                }

                const compositeCanvas = createQRCompositeCanvas(qrCanvas, styleObj, 100);

                const link = document.createElement('a');
                link.download = `${downloadItem.item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
                link.href = compositeCanvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            setDownloadItem(null);
        }, 500);

        return () => clearTimeout(timer);
    }, [downloadItem]);

    // Handle embed effect
    useEffect(() => {
        if (!embedItem) return;

        const timer = setTimeout(() => {
            const qrCanvas = document.getElementById('qr-embed-canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                let styleObj: QRStyle;
                if (embedItem.style) {
                    styleObj = typeof embedItem.style === 'string' ? JSON.parse(embedItem.style) : embedItem.style as any;
                } else {
                    styleObj = { labelText: '', fgColor: '#000', bgColor: '#fff', eyeRadius: [0, 0, 0, 0], logoImage: '' };
                }

                const compositeCanvas = createQRCompositeCanvas(qrCanvas, styleObj, 40);

                const img = new Image();
                img.onload = () => {
                    const finalCanvas = document.createElement('canvas');
                    finalCanvas.width = img.width;
                    finalCanvas.height = img.height;
                    const ctx = finalCanvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);

                        let targetQRWidth = img.width * 0.07;
                        if (targetQRWidth < 70) targetQRWidth = 70;
                        if (targetQRWidth > img.width / 4) targetQRWidth = img.width / 4;

                        const scale = targetQRWidth / compositeCanvas.width;
                        const targetQRHeight = compositeCanvas.height * scale;

                        const padding = targetQRWidth * 0.1;
                        const x = img.width - targetQRWidth - padding;
                        const y = img.height - targetQRHeight - padding;

                        // We can add a drop shadow to the QR composite on the image
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                        ctx.shadowBlur = 10;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 4;

                        ctx.drawImage(compositeCanvas, x, y, targetQRWidth, targetQRHeight);

                        const link = document.createElement('a');
                        const ext = embedItem.file.name.split('.').pop() || 'png';
                        link.download = `${embedItem.item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_infographic.${ext}`;
                        link.href = finalCanvas.toDataURL(`image/${ext === 'jpg' ? 'jpeg' : 'png'}`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                    URL.revokeObjectURL(img.src);
                    setEmbedItem(null);
                };
                img.src = URL.createObjectURL(embedItem.file);
            } else {
                setEmbedItem(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [embedItem]);

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

        // Merge current user config style over stored style
        if (userStyle) {
            style = { ...style, ...userStyle };
        }

        setDownloadItem({ item, style });
    };

    const prepareEmbed = (item: QRCodeData, file: File) => {
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

        // Merge current user config style over stored style
        if (userStyle) {
            style = { ...style, ...userStyle };
        }

        setEmbedItem({ item, style, file });
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
                {embedItem && (
                    <QRCodePreview
                        id="qr-embed-canvas"
                        value={getUrl(embedItem.item)}
                        style={embedItem.style}
                        size={1000} // High res for embedding too
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
                            onEmbed={prepareEmbed}
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
