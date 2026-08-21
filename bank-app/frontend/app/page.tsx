import React from 'react';
import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Bank Modern</div>
        <nav className={styles.nav}>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </nav>
      </header>

      <main className={styles.main} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <section className={styles.hero}>
          <h1>Welcome to Bank Modern</h1>
          <p>Your finances, elevated. A modern classic approach to banking.</p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/login">
              <button className={styles.actionButton} style={{ width: 'auto' }}>Sign In</button>
            </Link>
            <Link href="/register">
              <button className={styles.actionButton} style={{ width: 'auto', backgroundColor: '#536b78' }}>Create Account</button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
