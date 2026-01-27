'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Globe, Lock } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.iconWrapper}>
          <ShieldCheck size={64} className={styles.heroIcon} />
        </div>
        <h1 className={styles.title}>Trace-it</h1>
        <p className={styles.subtitle}>
          Ensure authenticity and trust with every scan. <br />
          The standard for verified content delivery.
        </p>

        <div className={styles.ctaContainer}>
          <Link href="/dashboard" className={styles.button}>
            Go to Dashboard <ArrowRight size={20} />
          </Link>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <Globe className={styles.featureIcon} />
            <h3>Verified Sources</h3>
            <p>Link physical codes to verifiable digital content.</p>
          </div>
          <div className={styles.featureCard}>
            <Lock className={styles.featureIcon} />
            <h3>Secure & Trusted</h3>
            <p>Built-in verification tracking and analytics.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
