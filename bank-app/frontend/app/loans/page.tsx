'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from './page.module.css';
import { HandCoins } from 'lucide-react';

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  status: string;
  createdAt: string;
}

export default function Loans() {
  const { token } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetch('/api/loans', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setLoans(data));
    }
  }, [token]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Loan application submitted!');
        setLoans([...loans, data.loan]);
        setAmount('');
      } else {
        setError(data.error || 'Application failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Loans & Credit</h1>
        <p className={styles.subtitle}>Apply for a loan and manage your credit.</p>
      </div>

      <div className={styles.grid}>
        <Card className={styles.applyCard}>
          <div className={styles.cardHeader}>
            <h3>Apply for a Loan</h3>
            <HandCoins className={styles.cardIcon} size={24} />
          </div>
          <p className={styles.cardDesc}>
            Get instant approval for personal loans up to $50,000. Current interest rate is 5.0% APR.
          </p>
          
          <form onSubmit={handleApply} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Requested Amount</label>
              <div className={styles.amountInputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  required
                  className={styles.amountInput}
                />
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.success}>{message}</div>}

            <Button type="submit" fullWidth>Submit Application</Button>
          </form>
        </Card>

        <div className={styles.historyCol}>
          <h2 className={styles.sectionTitle}>Your Loans</h2>
          <div className={styles.loanList}>
            {loans.map(loan => (
              <Card key={loan.id} className={styles.loanItem}>
                <div className={styles.loanHeader}>
                  <span className={styles.loanAmount}>${loan.amount.toLocaleString()}</span>
                  <span className={`${styles.statusBadge} ${styles[loan.status.toLowerCase()]}`}>
                    {loan.status}
                  </span>
                </div>
                <div className={styles.loanMeta}>
                  <span>Interest: {loan.interestRate}%</span>
                  <span>Applied on: {new Date(loan.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
            {loans.length === 0 && (
              <p className={styles.emptyText}>You haven&apos;t applied for any loans yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
