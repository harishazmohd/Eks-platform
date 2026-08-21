'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from '../auth.module.css';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.authCard}>
        <div className={styles.logo}>
          <Wallet size={32} className={styles.logoIcon} />
          <span>NovaBank</span>
        </div>
        
        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.subtitle}>Start your financial journey with us today.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.input}
              placeholder="John Doe"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="name@example.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" fullWidth>Create Account</Button>
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
