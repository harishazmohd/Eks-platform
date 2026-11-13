'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from '../auth.module.css';
import Link from 'next/link';
import { Wallet, User, Mail, Lock, Eye, EyeOff, Gift } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Unable to reach registration service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.authCard}>
        <div className={styles.logo}>
          <div className={styles.logoIconWrapper}>
            <Wallet size={22} />
          </div>
          <span>NovaBank</span>
        </div>

        <h1 className={styles.title}>Open Your Account</h1>
        <p className={styles.subtitle}>
          Instant activation with preloaded Checking and Savings accounts.
        </p>

        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '0.65rem 0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.785rem',
          color: '#34d399'
        }}>
          <Gift size={16} style={{ flexShrink: 0 }} />
          <span>Includes <strong>$2,000.00</strong> welcome testing liquidity upon registration.</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Legal Full Name</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={styles.input}
                placeholder="Alex Morgan"
                autoComplete="name"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="alex.morgan@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={styles.input}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Create Free Account
          </Button>
        </form>

        <p className={styles.footerText}>
          Already have an account?
          <Link href="/login" className={styles.link}>Sign In</Link>
        </p>
      </Card>
    </div>
  );
}
