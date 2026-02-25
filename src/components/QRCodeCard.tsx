import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, QrCode, BarChart2, Calendar, FolderInput, Edit2, X, Check, Folder as FolderIcon, Image as ImageIcon } from 'lucide-react';
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
    onEmbed?: (qr: QRCodeData, file: File) => void;
    folders: FolderType[];
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ qr, onDownload, onMove, onUpdate, onEmbed, folders }) => {
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedEmbedFile, setSelectedEmbedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedEmbedFile(file);
        }
        // Don't reset right away so we know a file is selected
    };

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

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>{qr.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    <Calendar size={12} style={{ marginRight: '4px' }} />
                    {new Date(qr.created_at).toLocaleDateString()}
                </div>
            </div>

            <div className={styles.cardUrl} style={{ overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '1rem' }}>
                {qr.type === 'link' ? qr.destination_url : (qr.type === 'verified_content' ? 'Verified Content' : 'Custom Landing Page')}
            </div>

            <div className={styles.cardStats} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.8rem' }}>
                    <BarChart2 size={14} /> {qr.scans} scans
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                        borderRadius: '4px'
                    }}
                    title="Edit Name/URL"
                >
                    <Edit2 size={14} />
                </button>

                {/* Folder Move Button */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
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

                {/* Embed Image Button */}
                {onEmbed && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                background: selectedEmbedFile ? '#e0e7ff' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: selectedEmbedFile ? '#4f46e5' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                fontWeight: selectedEmbedFile ? 500 : 'normal'
                            }}
                            title={selectedEmbedFile ? `Selected: ${selectedEmbedFile.name}` : "Add Infographic Background"}
                        >
                            <ImageIcon size={14} />
                            <span>{selectedEmbedFile ? 'Loaded' : 'Embed'}</span>
                            {selectedEmbedFile && <Check size={12} />}
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.cardActions}>
                <Link href={`/${qr.id}?preview=true`} target="_blank" className={styles.actionLink}>
                    <ExternalLink size={14} /> View
                </Link>
                {onEmbed && (
                    <button
                        className={styles.downloadBtn}
                        style={{
                            opacity: selectedEmbedFile ? 1 : 0.6,
                            cursor: selectedEmbedFile ? 'pointer' : 'not-allowed',
                            background: selectedEmbedFile ? '#1e293b' : undefined,
                            color: selectedEmbedFile ? 'white' : undefined,
                        }}
                        onClick={() => {
                            if (selectedEmbedFile) {
                                onEmbed(qr, selectedEmbedFile);
                            } else {
                                alert("Please add an image first using the icon next to the folder name.");
                                fileInputRef.current?.click();
                            }
                        }}
                        title="Download Embedded Image"
                    >
                        <ImageIcon size={14} /> Embedded
                    </button>
                )}
                <button
                    className={styles.downloadBtn}
                    onClick={() => onDownload(qr)}
                    title="Download PNG"
                >
                    <QrCode size={14} /> PNG
                </button>
            </div>
        </div>
    );
};
