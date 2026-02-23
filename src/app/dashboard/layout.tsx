import Link from 'next/link';
import { LayoutDashboard, PlusCircle, FolderOpen, Settings, QrCode } from 'lucide-react';
import styles from './dashboard.module.css';
import { ThemeToggle } from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const firstName = user?.user_metadata?.first_name || '';
    const lastName = user?.user_metadata?.last_name || '';
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : (user?.email || 'User');
    const email = user?.email || '';
    const initial = displayName.charAt(0).toUpperCase();
    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <QrCode size={28} className={styles.logoIcon} />
                    <span>Trace-it Gen</span>
                </div>

                <nav className={styles.nav}>
                    <Link href="/dashboard" className={styles.navItem}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link href="/dashboard/create" className={styles.navItem}>
                        <PlusCircle size={20} /> Create QR
                    </Link>
                    <Link href="/dashboard/folders" className={styles.navItem}>
                        <FolderOpen size={20} /> Folders
                    </Link>

                </nav>

                <div className={styles.footer}>
                    <LogoutButton className={styles.logoutBtn} />
                </div>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.breadcrumbs}>Dashboard / Overview</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ThemeToggle />
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>{initial}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                <span>{displayName}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>{email}</span>
                            </div>
                        </div>
                    </div>
                </header>
                <div className={styles.contentScroll}>
                    {children}
                </div>
            </main>
        </div>
    );
}
