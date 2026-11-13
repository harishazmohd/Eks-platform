import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  CreditCard,
  Sparkles
} from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.glowTop} />
      <div className={styles.glowRight} />

      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Wallet size={20} />
          </div>
          <span>NovaBank</span>
        </div>

        <nav className={styles.nav}>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#metrics" className={styles.navLink}>Transparency</Link>
          <Link href="#security" className={styles.navLink}>Security</Link>
        </nav>

        <div className={styles.authButtons}>
          <Link href="/login" className={styles.signInBtn}>Sign In</Link>
          <Link href="/register" className={styles.signUpBtn}>Open Account</Link>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.badgePill}>
            <Sparkles size={14} />
            <span>Next-Generation Banking Protocol</span>
          </div>

          <h1 className={styles.heroTitle}>
            Banking, stripped of <span className={styles.gradientText}>all complexity</span>.
          </h1>

          <p className={styles.heroSubtitle}>
            A modern, minimalist financial platform built for speed. Zero hidden fees,
            instant peer-to-peer settlements, high-yield smart vaults, and complete security.
          </p>

          <div className={styles.heroActions}>
            <Link href="/register" className={styles.signUpBtn} style={{ padding: '0.85rem 1.8rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Get Started in 60s</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={styles.signInBtn} style={{ padding: '0.85rem 1.6rem', fontSize: '1rem' }}>
              Explore Live Demo
            </Link>
          </div>
        </section>

        {/* Card Showcase */}
        <section className={styles.showcaseSection}>
          <div className={styles.cardShowcase}>
            <div className={styles.cardTop}>
              <div className={styles.cardLogo}>
                <Wallet size={18} color="#818cf8" />
                <span>Nova Platinum</span>
              </div>
              <span className={styles.cardTier}>Contactless</span>
            </div>

            <div>
              <div className={styles.cardChip} />
              <div className={styles.cardNumber}>4829 •••• •••• 9214</div>
            </div>

            <div className={styles.cardBottom}>
              <div>
                <div className={styles.cardHolderLabel}>Cardholder</div>
                <div className={styles.cardHolderName}>HARIS ARCH</div>
              </div>
              <div>
                <div className={styles.cardHolderLabel}>Expires</div>
                <div className={styles.cardHolderName}>08/29</div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <section id="metrics" className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <div className={styles.metricValue}>$4.2B+</div>
            <div className={styles.metricLabel}>Total Volume Processed</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricValue}>99.99%</div>
            <div className={styles.metricLabel}>Infrastructure Uptime</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricValue}>0.00%</div>
            <div className={styles.metricLabel}>Hidden Maintenance Fees</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricValue}>&lt; 50ms</div>
            <div className={styles.metricLabel}>Instant Settlement Time</div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features">
          <h2 className={styles.featuresTitle}>Crafted for modern personal finance</h2>
          <p className={styles.featuresDesc}>
            Every detail is designed with intention. Experience seamless control over your wealth.
          </p>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Zap size={22} />
              </div>
              <h3 className={styles.featureTitle}>Instant Global Rails</h3>
              <p className={styles.featureText}>
                Transfer money to anyone in real-time with zero friction, zero delays, and instant confirmation receipts.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper} style={{ color: '#10b981' }}>
                <TrendingUp size={22} />
              </div>
              <h3 className={styles.featureTitle}>High-Yield Vaults</h3>
              <p className={styles.featureText}>
                Set up automated goal-based savings vaults with progress trackers and real-time interest compounding.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper} style={{ color: '#06b6d4' }}>
                <CreditCard size={22} />
              </div>
              <h3 className={styles.featureTitle}>Virtual & Titanium Cards</h3>
              <p className={styles.featureText}>
                Generate virtual cards on demand, lock or freeze cards instantly from your dashboard, and manage limits.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper} style={{ color: '#f59e0b' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 className={styles.featureTitle}>Bank-Grade Encryption</h3>
              <p className={styles.featureText}>
                State-of-the-art 256-bit AES encryption, granular session tokens, and automated fraud prevention heuristics.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 NovaBank Technologies Inc. All rights reserved. Built with minimalist precision.</p>
      </footer>
    </div>
  );
}
