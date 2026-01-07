'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link as LinkIcon, FileText, ShieldCheck, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './create.module.css';

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
            } : undefined
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

            <form onSubmit={handleSubmit} className={styles.form}>
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

                {mode === 'landing' && (
                    <div className={styles.landingForm}>
                        {/* ... Landing page inputs (same as before) ... */}
                        <div className={styles.section}>
                            <label>Page Title</label>
                            <input
                                type="text"
                                value={landingTitle}
                                onChange={(e) => setLandingTitle(e.target.value)}
                                placeholder="My Company"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.section}>
                            <label>Description</label>
                            <textarea
                                value={landingDesc}
                                onChange={(e) => setLandingDesc(e.target.value)}
                                placeholder="Short bio or description..."
                                className={styles.textarea}
                            />
                        </div>
                        <div className={styles.section}>
                            <label>Profile Image URL</label>
                            <input
                                type="url"
                                value={landingImage}
                                onChange={(e) => setLandingImage(e.target.value)}
                                placeholder="https://..."
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.linksSection}>
                            <label>Links</label>
                            {landingLinks.map((link, index) => (
                                <div key={index} className={styles.linkRow}>
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        value={link.title}
                                        onChange={(e) => updateLink(index, 'title', e.target.value)}
                                        className={styles.input}
                                    />
                                    <input
                                        type="url"
                                        placeholder="URL"
                                        value={link.url}
                                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                                        className={styles.input}
                                    />
                                    <button type="button" onClick={() => removeLink(index)} className={styles.deleteBtn}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addLink} className={styles.addBtn}>
                                <Plus size={16} /> Add Link
                            </button>
                        </div>
                    </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    <Save size={20} /> {loading ? 'Creating...' : 'Create QR Code'}
                </button>
            </form>
        </div>
    );
}
