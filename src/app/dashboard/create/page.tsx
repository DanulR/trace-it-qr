'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link as LinkIcon, FileText, ShieldCheck, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './create.module.css';
import { QRCodePreview, QRStyle } from '@/components/QRCodePreview';

type LinkItem = {
    title: string;
    url: string;
    icon: string;
};

export default function CreateQR() {
    const router = useRouter();
    const [mode, setMode] = useState<'link' | 'landing' | 'verified_content'>('verified_content');
    const [loading, setLoading] = useState(false);

    // Common Fields
    const [title, setTitle] = useState('');
    const [folder, setFolder] = useState('General');
    const [customDomain, setCustomDomain] = useState('');

    // Link Mode
    const [destinationUrl, setDestinationUrl] = useState('');

    // Landing Mode
    const [landingTitle, setLandingTitle] = useState('');
    const [landingDesc, setLandingDesc] = useState('');
    const [landingImage, setLandingImage] = useState('');
    const [landingLinks, setLandingLinks] = useState<LinkItem[]>([{ title: '', url: '', icon: 'globe' }]);
    const [themeColor, setThemeColor] = useState('#ffffff');

    // Verified Content Mode
    const [organization, setOrganization] = useState('');
    const [contentCategory, setContentCategory] = useState('Official Statement');

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

    const [qrStyle, setQrStyle] = useState<QRStyle>({
        fgColor: '#000000',
        bgColor: '#ffffff',
        logoImage: '/logo-placeholder.png', // Or empty string, user can paste URL
        eyeRadius: [0, 0, 0, 0], // Square by default
        labelText: '',
    });

    // Determine preview value
    const getPreviewValue = () => {
        const base = customDomain ? `https://${customDomain}.trace-it.io` : typeof window !== 'undefined' ? window.location.origin : 'https://trace-it.io';
        return `${base}/preview-qr-id`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            type: mode,
            title,
            folder,
            custom_domain: customDomain,
            organization: mode === 'verified_content' ? organization : undefined,
            content_category: mode === 'verified_content' ? contentCategory : undefined,
            destination_url: (mode === 'link' || mode === 'verified_content') ? destinationUrl : undefined,
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
                        {/* Basic Info */}
                        <div className={styles.section}>
                            <label>Internal Name (for your dashboard)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Q1 Financial Report"
                                required
                                className={styles.input}
                            />
                        </div>

                        {mode === 'verified_content' && (
                            <div className={styles.landingForm}>
                                <div className={styles.section}>
                                    <label>Organization Name</label>
                                    <input
                                        type="text"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                        placeholder="e.g. Verité Research"
                                        required
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.section}>
                                    <label>Content Category</label>
                                    <select
                                        value={contentCategory}
                                        onChange={(e) => setContentCategory(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="Official Statement">Official Statement</option>
                                        <option value="Fact Check">Fact Check</option>
                                        <option value="Research Report">Research Report</option>
                                        <option value="Press Release">Press Release</option>
                                    </select>
                                </div>
                                <div className={styles.section}>
                                    <label>Source URL (The content to verify)</label>
                                    <input
                                        type="url"
                                        value={destinationUrl}
                                        onChange={(e) => setDestinationUrl(e.target.value)}
                                        placeholder="https://..."
                                        required
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.section}>
                                    <label>Custom Domain (Verification Source)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={customDomain}
                                            onChange={(e) => setCustomDomain(e.target.value)}
                                            placeholder="veriteresearch"
                                            className={styles.input}
                                            style={{ flex: 1 }}
                                        />
                                        <span style={{ color: '#94a3b8' }}>.trace-it.io</span>
                                    </div>
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

                            <div className={styles.section}>
                                <label>Logo URL (Center Image)</label>
                                <input
                                    type="text"
                                    value={qrStyle.logoImage}
                                    onChange={(e) => setQrStyle({ ...qrStyle, logoImage: e.target.value })}
                                    placeholder="https://..."
                                    className={styles.input}
                                />
                            </div>

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
