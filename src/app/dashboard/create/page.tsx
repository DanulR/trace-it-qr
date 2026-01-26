'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link as LinkIcon, FileText, ShieldCheck, Plus, Trash2, Save, ArrowLeft, FolderPlus, X } from 'lucide-react';
import Link from 'next/link';
import styles from './create.module.css';
import { QRCodePreview, QRStyle } from '@/components/QRCodePreview';

type LinkItem = {
    title: string;
    url: string;
    icon: string;
};

type Folder = {
    id: string;
    name: string;
};

export default function CreateQR() {
    const router = useRouter();
    const [mode, setMode] = useState<'link' | 'landing' | 'verified_content'>('verified_content');
    const [loading, setLoading] = useState(false);

    // Common Fields
    // Title is now auto-generated, not manually input (except as specific fields like Org Name)
    const [folder, setFolder] = useState('General');
    // REMOVED customDomain state

    // Folder Management
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isFolderLoading, setIsFolderLoading] = useState(false);

    // Link Mode
    const [destinationUrl, setDestinationUrl] = useState('');

    // Landing Mode
    const [landingTitle, setLandingTitle] = useState('');
    const [landingDesc, setLandingDesc] = useState('');
    const [landingImage, setLandingImage] = useState('');
    const [landingLinks, setLandingLinks] = useState<LinkItem[]>([{ title: '', url: '', icon: 'globe' }]);
    const [themeColor, setThemeColor] = useState('#ffffff');

    // Verified Content Mode
    // REMOVED organization state
    // Verified Content Mode
    // REMOVED organization state
    // Content Category is fixed to Fact Check
    const [contentCategory] = useState('Fact Check');
    const [sourceUrls, setSourceUrls] = useState<string[]>(['']);

    useEffect(() => {
        fetchFolders();
    }, []);

    const fetchFolders = async () => {
        try {
            const res = await fetch('/api/folders');
            if (res.ok) {
                const data = await res.json();
                setFolders(data);
            }
        } catch (error) {
            console.error('Failed to fetch folders', error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setIsFolderLoading(true);
        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName }),
            });

            if (res.ok) {
                await fetchFolders();
                setFolder(newFolderName); // Auto-select new folder
                setIsCreatingFolder(false);
                setNewFolderName('');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create folder');
            }
        } catch (error) {
            alert('Error creating folder');
        } finally {
            setIsFolderLoading(false);
        }
    };

    const addLink = () => {
        setLandingLinks([...landingLinks, { title: '', url: '', icon: 'globe' }]);
    };

    const removeLink = (index: number) => {
        setLandingLinks(landingLinks.filter((_, i) => i !== index));
    };

    const updateLink = (index: number, field: keyof LinkItem, value: string) => {
        const newLinks = [...landingLinks];
        newLinks[index][field] = value;
        setLandingLinks(newLinks);
    };

    const addSourceUrl = () => {
        setSourceUrls([...sourceUrls, '']);
    };

    const removeSourceUrl = (index: number) => {
        if (sourceUrls.length > 1) {
            setSourceUrls(sourceUrls.filter((_, i) => i !== index));
        }
    };

    const updateSourceUrl = (index: number, value: string) => {
        const newUrls = [...sourceUrls];
        newUrls[index] = value;
        setSourceUrls(newUrls);
    };

    const [qrStyle, setQrStyle] = useState<QRStyle>({
        fgColor: '#000000',
        bgColor: '#ffffff',
        logoImage: '/logo.png', // Static logo
        eyeRadius: [0, 0, 0, 0], // Square by default
        labelText: 'Trace-it',
    });

    // Determine preview value
    const getPreviewValue = () => {
        const base = typeof window !== 'undefined' ? window.location.origin : 'https://trace-it.io';
        return `${base}/preview-qr-id`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Auto-generate title based on content
        let autoTitle = 'Untitled QR';
        if (mode === 'landing' && landingTitle) {
            autoTitle = landingTitle;
        } else if (mode === 'link' && destinationUrl) {
            try {
                const urlObj = new URL(destinationUrl);
                autoTitle = urlObj.hostname;
            } catch {
                autoTitle = destinationUrl;
            }
        } else if (mode === 'verified_content' && sourceUrls.length > 0 && sourceUrls[0]) {
            try {
                const urlObj = new URL(sourceUrls[0]);
                autoTitle = urlObj.hostname;
            } catch {
                autoTitle = sourceUrls[0];
            }
        } else {
            autoTitle = `QR - ${new Date().toLocaleDateString()}`;
        }

        const finalDestinationUrl = mode === 'verified_content'
            ? JSON.stringify(sourceUrls.filter(u => u.trim() !== ''))
            : destinationUrl;

        const payload = {
            type: mode,
            title: autoTitle, // internal name is now auto-generated
            folder,
            custom_domain: undefined,
            organization: undefined,
            content_category: mode === 'verified_content' ? contentCategory : undefined,
            destination_url: (mode === 'link' || mode === 'verified_content') ? finalDestinationUrl : undefined,
            landing_content: mode === 'landing' ? {
                title: landingTitle,
                description: landingDesc,
                image: landingImage,
                links: landingLinks,
                theme: { background: themeColor }
            } : undefined,
            style: qrStyle
        };

        try {
            const res = await fetch('/api/qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push('/dashboard');
                router.refresh(); // Ensure the dashboard updates
            } else {
                const data = await res.json();
                alert(`Error: ${data.details || data.error || 'Failed to create QR code'}`);
            }
        } catch (err: any) {
            console.error(err);
            alert('Something went wrong: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/dashboard" className={styles.backLink}>
                    <ArrowLeft size={18} /> Back
                </Link>
                <h1>Create New QR Code</h1>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${mode === 'verified_content' ? styles.activeTab : ''}`}
                    onClick={() => setMode('verified_content')}
                >
                    <ShieldCheck size={18} /> Verified Content
                </button>
                <button
                    className={`${styles.tab} ${mode === 'landing' ? styles.activeTab : ''}`}
                    onClick={() => setMode('landing')}
                >
                    <FileText size={18} /> Landing Page
                </button>
                <button
                    className={`${styles.tab} ${mode === 'link' ? styles.activeTab : ''}`}
                    onClick={() => setMode('link')}
                >
                    <LinkIcon size={18} /> Website URL
                </button>
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.formColumn}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Folder Selection (Replaces Internal Name) */}
                        <div className={styles.section}>
                            <label>Save to Folder</label>
                            {!isCreatingFolder ? (
                                <select
                                    value={folder}
                                    onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                            setIsCreatingFolder(true);
                                        } else {
                                            setFolder(e.target.value);
                                        }
                                    }}
                                    className={styles.select}
                                >
                                    {folders.map(f => (
                                        <option key={f.id} value={f.name}>{f.name}</option>
                                    ))}
                                    <option value="__NEW__" style={{ fontWeight: 'bold', color: '#6366f1' }}>+ Create New Folder</option>
                                </select>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="New Folder Name"
                                        className={styles.input}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateFolder}
                                        className={styles.tab}
                                        style={{ background: '#6366f1', color: 'white', border: 'none' }}
                                        disabled={isFolderLoading}
                                    >
                                        <Save size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingFolder(false)}
                                        className={styles.tab}
                                        style={{ background: '#ef4444', color: 'white', border: 'none' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {mode === 'verified_content' && (
                            <div className={styles.landingForm}>

                                {/* REMOVED Content Category Selection - Hardcoded to Fact Check */}

                                <div className={styles.section}>
                                    <label>Source URLs (The content to verify)</label>
                                    {sourceUrls.map((url, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => updateSourceUrl(index, e.target.value)}
                                                placeholder="https://..."
                                                required={index === 0} // Only first one required
                                                className={styles.input}
                                            />
                                            {sourceUrls.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSourceUrl(index)}
                                                    className={styles.destructiveBtn}
                                                    style={{ padding: '0.5rem' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addSourceUrl}
                                        className={styles.secondaryBtn}
                                        style={{ marginTop: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        <Plus size={14} /> Add Another Source URL
                                    </button>
                                </div>

                            </div>
                        )}

                        {mode === 'link' && (
                            <div className={styles.section}>
                                <label>Destination URL</label>
                                <input
                                    type="url"
                                    value={destinationUrl}
                                    onChange={(e) => setDestinationUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    required
                                    className={styles.input}
                                />
                            </div>
                        )}

                        {/* Design Customization */}
                        <div className={styles.advancedSection}>
                            <h3>Design Customization</h3>

                            <div className={styles.colorSection}>
                                <div className={styles.section}>
                                    <label>Foreground Color</label>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={qrStyle.fgColor}
                                        onChange={e => setQrStyle({ ...qrStyle, fgColor: e.target.value })}
                                    />
                                </div>
                                <div className={styles.section}>
                                    <label>Background Color</label>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={qrStyle.bgColor}
                                        onChange={e => setQrStyle({ ...qrStyle, bgColor: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Logo URL input removed for static image */}

                            <div className={styles.section}>
                                <label>Label Text (Below QR)</label>
                                <input
                                    type="text"
                                    value={qrStyle.labelText}
                                    onChange={(e) => setQrStyle({ ...qrStyle, labelText: e.target.value })}
                                    placeholder="e.g. Trace-it"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.section}>
                                <label>Corner Style</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setQrStyle({ ...qrStyle, eyeRadius: [0, 0, 0, 0] })}
                                        className={`${styles.tab} ${qrStyle.eyeRadius[0] === 0 ? styles.activeTab : ''}`}
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                    >
                                        Square
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQrStyle({ ...qrStyle, eyeRadius: [10, 10, 10, 10] })}
                                        className={`${styles.tab} ${qrStyle.eyeRadius[0] > 0 ? styles.activeTab : ''}`}
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                    >
                                        Rounded
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            <Save size={20} /> {loading ? 'Creating...' : 'Create QR Code'}
                        </button>
                    </form>
                </div>

                <div className={styles.previewColumn}>
                    <div className={styles.previewCard}>
                        <div className={styles.previewTitle}>Live Preview</div>
                        <QRCodePreview
                            value={getPreviewValue()}
                            style={qrStyle}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginTop: '1rem' }}>
                            This is how your QR code will appear.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
