import Link from 'next/link';
import { LayoutDashboard, PlusCircle, FolderOpen, Settings, LogOut, QrCode } from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
                    <Link href="/dashboard/domains" className={styles.navItem}>
                        <Settings size={20} /> Domains
                    </Link>
                </nav>

                <div className={styles.footer}>
                    <button className={styles.logoutBtn}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.breadcrumbs}>Dashboard / Overview</div>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>U</div>
                        <span>User Name</span>
                    </div>
                </header>
                <div className={styles.contentScroll}>
                    {children}
                </div>
            </main>
        </div>
    );
}
