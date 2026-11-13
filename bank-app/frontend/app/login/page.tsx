'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from '../auth.module.css';
import Link from 'next/link';
import { Wallet, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Unable to reach the authentication service');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = async () => {
    const demoEmail = 'alex.morgan@novabank.io';
    const demoPassword = 'Password123!';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    // Try login or register automatically if demo doesn't exist
    try {
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });

      if (!res.ok) {
        // Automatically create demo user
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alex Morgan',
            email: demoEmail,
            password: demoPassword,
          }),
        });

        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: demoPassword }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Demo login failed');
      }
    } catch {
      setError('Demo service unavailable');
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

        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your private financial command center.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
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
                placeholder="name@example.com"
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
                className={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
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
            Sign In
          </Button>
        </form>

        <div className={styles.demoBanner}>
          <button
            type="button"
            className={styles.demoBtn}
            onClick={handleFillDemo}
            disabled={loading}
          >
            <Sparkles size={15} />
            <span>1-Click Instant Demo Login</span>
          </button>
        </div>

        <p className={styles.footerText}>
          Don&apos;t have an account?
          <Link href="/register" className={styles.link}>Open one now</Link>
        </p>
      </Card>
    </div>
  );
}
