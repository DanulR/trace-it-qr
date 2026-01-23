'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, ExternalLink, QrCode, BarChart2, Calendar, FolderInput } from 'lucide-react';
import styles from './QRCodeCard.module.css';
import { QRCodeData } from '@/lib/db';
import { Folder } from '@/lib/db'; // Make sure Folder type is exported or define it here

// Re-defining Folder locally if import fails or to allow standalone usage
type FolderType = {
    id: string;
    name: string;
};

// We need to map DB type to our UI usage. 
// QRCodeData from db.ts matches mostly.

interface QRCodeCardProps {
    qr: QRCodeData;
    onDownload: (qr: QRCodeData) => void;
    onMove: (qr: QRCodeData, folderName: string) => void;
    folders: FolderType[];
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ qr, onDownload, onMove, folders }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMove = (folderName: string) => {
        onMove(qr, folderName);
        setShowMenu(false);
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.typeBadge}>
                    {qr.type === 'link' ? 'URL' : (qr.type === 'verified_content' ? 'Verified' : 'Page')}
                </div>
                <div className={styles.moreContainer} ref={menuRef}>
                    <button className={styles.moreBtn} onClick={() => setShowMenu(!showMenu)}>
                        <MoreVertical size={16} />
                    </button>
                    {showMenu && (
                        <div className={styles.dropdown}>
                            <div style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                                Move to Folder
                            </div>
                            {folders.length === 0 ? (
                                <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>No folders</div>
                            ) : (
                                folders.map(f => (
                                    <button
                                        key={f.id}
                                        className={styles.dropdownItem}
                                        onClick={() => handleMove(f.name)}
                                        disabled={qr.folder === f.name}
                                        style={{ opacity: qr.folder === f.name ? 0.5 : 1 }}
                                    >
                                        {f.name}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
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
                <div className={styles.stat} style={{ marginLeft: 'auto', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {qr.folder && qr.folder !== 'General' && <span style={{ fontSize: '0.7rem', background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>{qr.folder}</span>}
                </div>
            </div>

            <div className={styles.cardActions}>
                <Link href={`/${qr.id}`} target="_blank" className={styles.actionLink}>
                    <ExternalLink size={14} /> View
                </Link>
                <button
                    className={styles.downloadBtn}
                    onClick={() => onDownload(qr)}
                >
                    <QrCode size={14} /> PNG
                </button>
            </div>
        </div>
    );
};
