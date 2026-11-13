'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import styles from './page.module.css';
import { HandCoins, Zap, CheckCircle2, DollarSign } from 'lucide-react';

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  status: string;
  createdAt: string;
}

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

export default function Loans() {
  const { token, privacyMode, triggerRefresh, refreshTrigger } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Loan Calculator State
  const [amount, setAmount] = useState('5000');
  const [tenure, setTenure] = useState(12); // months
  const interestRate = 5.0; // APR
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Repayment Modal State
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [repayAccountId, setRepayAccountId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayLoading, setRepayLoading] = useState(false);
  const [repayError, setRepayError] = useState('');
  const [repaySuccess, setRepaySuccess] = useState('');

  useEffect(() => {
    if (token) {
      fetch('/api/loans', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setLoans(data);
          }
        })
        .catch(console.error);

      fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setAccounts(data);
              if (data.length > 0) setRepayAccountId(data[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [token, refreshTrigger]);

  // Live Loan Calculation
  const principal = parseFloat(amount) || 0;
  const monthlyRate = (interestRate / 100) / 12;
  const monthlyPayment = principal > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1)
    : 0;
  const totalRepay = monthlyPayment * tenure;
  const totalInterest = Math.max(0, totalRepay - principal);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, interestRate }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Loan approved and disbursed instantly to your primary account!');
        if (data.loan) {
          setLoans((prev) => [data.loan, ...prev]);
        }
        triggerRefresh();
      } else {
        setError(data.error || 'Application failed');
      }
    } catch {
      setError('An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoan) return;

    setRepayError('');
    setRepaySuccess('');
    setRepayLoading(true);

    try {
      const res = await fetch(`/api/loans/${repayLoan.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: repayAccountId,
          amount: repayAmount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRepaySuccess('Repayment processed successfully!');
        triggerRefresh();
        setTimeout(() => {
          setRepayLoan(null);
          setRepaySuccess('');
          setRepayAmount('');
        }, 1200);
      } else {
        setRepayError(data.error || 'Repayment failed');
      }
    } catch {
      setRepayError('Repayment error occurred');
    } finally {
      setRepayLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Loans & Capital Credit</h1>
        <p className={styles.subtitle}>Instant algorithmic credit lines with fixed 5.0% APR and zero prepayment penalties.</p>
      </div>

      <div className={styles.grid}>
        {/* Left: Interactive Loan Calculator & Application */}
        <Card className={styles.applyCard}>
          <div className={styles.cardHeader}>
            <h3>Instant Credit Line Simulator</h3>
            <HandCoins className={styles.cardIcon} size={24} />
          </div>
          <p className={styles.cardDesc}>
            Select your desired liquidity and tenure. Approved capital is immediately credited to your checking account.
          </p>

          <form onSubmit={handleApply} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Requested Capital Amount ($)</label>
              <div className={styles.amountInputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  step="500"
                  min="1000"
                  max="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  required
                  className={styles.amountInput}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Loan Duration (Tenure)</label>
              <div className={styles.tenurePills}>
                {[6, 12, 24, 36].map((months) => (
                  <button
                    key={months}
                    type="button"
                    className={`${styles.tenureBtn} ${tenure === months ? styles.tenureBtnActive : ''}`}
                    onClick={() => setTenure(months)}
                  >
                    {months} Months
                  </button>
                ))}
              </div>
            </div>

            {/* Live Calculation Display Box */}
            <div className={styles.calcBox}>
              <div className={styles.calcMetric}>
                <span className={styles.calcLabel}>Estimated Monthly EMI</span>
                <span className={`${styles.calcVal} ${styles.calcValAccent}`}>
                  ${monthlyPayment ? monthlyPayment.toFixed(2) : '0.00'}/mo
                </span>
              </div>
              <div className={styles.calcMetric}>
                <span className={styles.calcLabel}>Fixed APR</span>
                <span className={styles.calcVal}>
                  {interestRate}%
                </span>
              </div>
              <div className={styles.calcMetric}>
                <span className={styles.calcLabel}>Total Interest Cost</span>
                <span className={styles.calcVal} style={{ color: '#94a3b8' }}>
                  ${totalInterest ? totalInterest.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className={styles.calcMetric}>
                <span className={styles.calcLabel}>Total Payback</span>
                <span className={styles.calcVal} style={{ color: '#f8fafc' }}>
                  ${totalRepay ? totalRepay.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {message && (
              <div className={styles.success}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">
              <Zap size={16} />
              <span>Apply for Instant Approval</span>
            </Button>
          </form>
        </Card>

        {/* Right: Active Loans History */}
        <div className={styles.historyCol}>
          <h2 className={styles.sectionTitle}>Your Active Credit & Loans</h2>

          <div className={styles.loanList}>
            {loans.map((loan) => (
              <div key={loan.id} className={styles.loanItem}>
                <div className={styles.loanHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Loan #{loan.id.slice(0, 8)}
                    </span>
                    <span className={styles.loanAmount}>
                      {privacyMode ? '••••••' : `$${loan.amount.toLocaleString()}`}
                    </span>
                  </div>

                  <span className={`${styles.statusBadge} ${styles[`status${loan.status.toLowerCase()}`]}`}>
                    {loan.status}
                  </span>
                </div>

                <div className={styles.loanMeta}>
                  <span>Interest: {loan.interestRate}% APR</span>
                  <span>Originated: {new Date(loan.createdAt).toLocaleDateString()}</span>
                </div>

                {loan.status === 'APPROVED' && loan.amount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRepayLoan(loan);
                      setRepayAmount(Math.min(loan.amount, 500).toString());
                    }}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <DollarSign size={14} />
                    <span>Make Repayment</span>
                  </Button>
                )}
              </div>
            ))}

            {loans.length === 0 && (
              <p className={styles.emptyText}>
                You currently have no outstanding credit lines or liabilities.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Repayment Modal */}
      <Modal
        isOpen={!!repayLoan}
        onClose={() => setRepayLoan(null)}
        title="Repay Loan"
        subtitle={`Repay balance for Loan #${repayLoan?.id.slice(0, 8)}`}
      >
        <form onSubmit={handleRepaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Funding Source Account</label>
            <select
              value={repayAccountId}
              onChange={(e) => setRepayAccountId(e.target.value)}
              style={{
                padding: '0.75rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountType} • {acc.accountNumber} (${acc.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Repayment Amount ($)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', color: '#64748b', fontWeight: 600 }}>$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={repayLoan ? repayLoan.amount : undefined}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="0.00"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2rem',
                  backgroundColor: '#0c1017',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              />
            </div>
            {repayLoan && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Remaining Loan Balance: ${repayLoan.amount.toLocaleString()}
              </span>
            )}
          </div>

          {repayError && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              fontSize: '0.85rem'
            }}>
              {repayError}
            </div>
          )}

          {repaySuccess && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              fontSize: '0.85rem'
            }}>
              {repaySuccess}
            </div>
          )}

          <Button type="submit" loading={repayLoading} fullWidth>
            Confirm Repayment
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
