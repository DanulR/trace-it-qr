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
import { createQRCompositeCanvas } from '@/lib/qr-canvas';

// Duplicate basic types if needed or import
export default function FolderViewPage({ params }: { params: Promise<{ name: string }> }) {
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadItem, setDownloadItem] = useState<{ item: QRCodeData, style: QRStyle } | null>(null);
    const [embedItem, setEmbedItem] = useState<{ item: QRCodeData, style: QRStyle, file: File } | null>(null);
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

                        // Add drop shadow
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
            try { style = JSON.parse(item.style); } catch (e) { console.error("Failed to parse style", e); }
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
            try { style = JSON.parse(item.style); } catch (e) { console.error("Failed to parse style", e); }
        }
        setEmbedItem({ item, style, file });
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
                {embedItem && (
                    <QRCodePreview
                        id="qr-embed-canvas"
                        value={getUrl(embedItem.item)}
                        style={embedItem.style}
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
