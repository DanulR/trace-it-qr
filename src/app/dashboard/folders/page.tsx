'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Folder as FolderIcon, Plus, Trash2 } from 'lucide-react';
import styles from './page.module.css';

type Folder = {
    id: string;
    name: string;
    created_at: string;
};

export default function FoldersPage() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchFolders();
    }, []);

    const fetchFolders = () => {
        fetch('/api/folders')
            .then(res => res.json())
            .then(data => {
                setFolders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName })
            });

            if (res.ok) {
                setNewFolderName('');
                setIsCreating(false);
                fetchFolders();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create folder');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete folder "${name}"? QR codes inside will be moved to General.`)) return;

        try {
            const res = await fetch(`/api/folders/${encodeURIComponent(name)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchFolders();
            } else {
                alert('Failed to delete folder');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <div className={styles.headerAction}>
                <h1 className={styles.pageTitle}>Folders</h1>
                <button onClick={() => setIsCreating(true)} className={styles.createBtn}>
                    <Plus size={20} /> New Folder
                </button>
            </div>

            {isCreating && (
                <div className={styles.createForm}>
                    <form onSubmit={handleCreate} className={styles.formInline}>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder Name"
                            className={styles.input}
                            autoFocus
                        />
                        <button type="submit" className={styles.submitBtn}>Create</button>
                        <button type="button" onClick={() => setIsCreating(false)} className={styles.cancelBtn}>Cancel</button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>Loading...</div>
            ) : folders.length === 0 ? (
                <div className={styles.emptyState}>
                    <FolderIcon size={48} className={styles.emptyIcon} />
                    <h3>No Folders yet</h3>
                    <p>Organize your QR codes with folders.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {folders.map(folder => (
                        <div key={folder.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.folderIcon}>
                                    <FolderIcon size={24} color="#8B0000" />
                                </div>
                                {folder.name !== 'General' && (
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(folder.name);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <Link href={`/dashboard/folders/${folder.name}`} className={styles.cardLink}>
                                <h3 className={styles.cardTitle}>{folder.name}</h3>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
