import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, ExternalLink, QrCode, BarChart2, Calendar, FolderInput, Edit2, X, Check } from 'lucide-react';
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
    onUpdate: (qr: QRCodeData, newTitle: string, newUrl?: string) => Promise<void>;
    folders: FolderType[];
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ qr, onDownload, onMove, onUpdate, folders }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(qr.title);
    const [editUrl, setEditUrl] = useState(qr.destination_url || '');
    const [isSaving, setIsSaving] = useState(false);

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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(qr, editTitle, qr.type === 'link' ? editUrl : undefined);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            alert('Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditTitle(qr.title);
        setEditUrl(qr.destination_url || '');
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className={styles.card} style={{ border: '2px solid #6366f1' }}>
                <div className={styles.cardHeader}>
                    <div className={styles.typeBadge}>
                        Editing...
                    </div>
                </div>
                <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Name</label>
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={styles.input} // Assuming styles.input exists or will inherit generic
                        style={{ width: '100%', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                    />

                    {qr.type === 'link' && (
                        <>
                            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Destination URL</label>
                            <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                            />
                        </>
                    )}
                </div>

                <div className={styles.cardActions} style={{ justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Cancel">
                        <X size={18} />
                    </button>
                    <button onClick={handleSave} disabled={isSaving} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }} title="Save">
                        <Check size={18} />
                    </button>
                </div>
            </div>
        )
    }

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
                            <button
                                className={styles.dropdownItem}
                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                            >
                                <Edit2 size={14} style={{ marginRight: '0.5rem' }} /> Edit
                            </button>
                            <div className={styles.divider} style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
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
            <div className={styles.cardUrl} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {qr.type === 'link' ? qr.destination_url : (qr.type === 'verified_content' ? 'Verified Content' : 'Custom Landing Page')}
            </div>

            <div className={styles.cardStats}>
                <div className={styles.stat}>
                    <BarChart2 size={14} /> {qr.scans} scans
                </div>
                <div className={styles.stat}>
                    <Calendar size={14} /> {new Date(qr.created_at).toLocaleDateString()}
                </div>
                <div className={styles.stat} style={{ marginLeft: 'auto', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {qr.folder && qr.folder !== 'General' && <span style={{ fontSize: '0.7rem', background: '#334155', padding: '2px 6px', borderRadius: '4px', color: 'white' }}>{qr.folder}</span>}
                </div>
            </div>

            <div className={styles.cardActions}>
                <Link href={`/${qr.id}?preview=true`} target="_blank" className={styles.actionLink}>
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
