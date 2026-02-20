import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, QrCode, BarChart2, Calendar, FolderInput, Edit2, X, Check, Folder as FolderIcon } from 'lucide-react';
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

    const initialUrls = (() => {
        if (!qr.destination_url) return [''];
        try {
            const parsed = JSON.parse(qr.destination_url);
            if (Array.isArray(parsed)) return parsed.length ? parsed : [''];
            return [qr.destination_url];
        } catch {
            return [qr.destination_url];
        }
    })();
    const [editUrls, setEditUrls] = useState<string[]>(initialUrls);
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
            const validUrls = editUrls.filter(u => u.trim() !== '');
            let finalUrlToSave = '';
            if (validUrls.length > 1) {
                finalUrlToSave = JSON.stringify(validUrls);
            } else if (validUrls.length === 1) {
                finalUrlToSave = validUrls[0];
            }

            await onUpdate(qr, editTitle, qr.type === 'link' ? finalUrlToSave : undefined);
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

        const resetUrls = (() => {
            if (!qr.destination_url) return [''];
            try {
                const parsed = JSON.parse(qr.destination_url);
                if (Array.isArray(parsed)) return parsed.length ? parsed : [''];
                return [qr.destination_url];
            } catch {
                return [qr.destination_url];
            }
        })();
        setEditUrls(resetUrls);

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
                            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Destination URLs</label>
                            {editUrls.map((url, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => {
                                            const newUrls = [...editUrls];
                                            newUrls[index] = e.target.value;
                                            setEditUrls(newUrls);
                                        }}
                                        style={{ flex: 1, padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px', width: '100%' }}
                                        placeholder="https://..."
                                    />
                                    {editUrls.length > 1 && (
                                        <button
                                            onClick={() => setEditUrls(editUrls.filter((_, i) => i !== index))}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                                            title="Remove URL"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => setEditUrls([...editUrls, ''])}
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#6366f1',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    padding: '0',
                                    marginTop: '0.2rem'
                                }}
                            >
                                + Add another URL
                            </button>
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

            </div>

            <h3 className={styles.cardTitle}>{qr.title}</h3>
            <div className={styles.cardUrl} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {qr.type === 'link' ? qr.destination_url : (qr.type === 'verified_content' ? 'Verified Content' : 'Custom Landing Page')}
            </div>

            <div className={styles.cardStats}>
                <div className={styles.stat}>
                    <BarChart2 size={14} /> {qr.scans} scans
                </div>
                <div className={styles.stat} style={{ display: 'flex', alignItems: 'center' }}>
                    <Calendar size={14} style={{ marginRight: '4px' }} />
                    {new Date(qr.created_at).toLocaleDateString()}
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '8px',
                            padding: '2px',
                            borderRadius: '4px'
                        }}
                        title="Edit"
                    >
                        <Edit2 size={14} />
                    </button>
                    {/* Folder Move Button */}
                    <div style={{ position: 'relative', marginLeft: '8px' }} ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                padding: '2px',
                            }}
                            title="Move to Folder"
                        >
                            <FolderIcon size={14} />
                            <span>{qr.folder || 'General'}</span>
                        </button>
                        {showMenu && (
                            <div className={styles.dropdown} style={{ right: 'auto', left: 0, top: '100%', marginTop: '4px' }}>
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
