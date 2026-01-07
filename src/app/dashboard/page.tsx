'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, QrCode, BarChart2, Calendar, MoreVertical } from 'lucide-react';
import styles from './page.module.css';
import QRCode from 'qrcode';

type QRCodeItem = {
    id: string;
    type: 'link' | 'landing' | 'verified_content';
    title: string;
    destination_url?: string;
    scans: number;
    created_at: string;
    folder: string;
};

export default function Dashboard() {
    const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
    const [loading, setLoading] = useState(true);

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

    const downloadQrCode = async (id: string, title: string) => {
        try {
            const url = `${window.location.origin}/${id}`;
            const dataUrl = await QRCode.toDataURL(url, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to generate QR', err);
            alert('Failed to download QR code');
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
                                    onClick={() => downloadQrCode(qr.id, qr.title)}
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
