'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Modal } from './Modal';
import { Button } from './Button';
import { Menu, Eye, EyeOff, PlusCircle } from 'lucide-react';
import styles from './DashboardLayout.module.css';

interface AccountOption {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, token, privacyMode, togglePrivacyMode, triggerRefresh, refreshTrigger } = useAuth();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  // Deposit Form State
  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCategory, setDepositCategory] = useState('SALARY');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setAccounts(data);
              setDepositAccountId((prev) => (prev ? prev : (data.length > 0 ? data[0].id : '')));
            }
          }
        })
        .catch(console.error);
    }
  }, [token, refreshTrigger]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');
    setDepositSuccess('');
    setDepositLoading(true);

    try {
      const res = await fetch('/api/accounts/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: depositAccountId,
          amount: depositAmount,
          category: depositCategory,
          description: depositDescription || 'Direct Deposit',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDepositSuccess('Funds deposited successfully!');
        setDepositAmount('');
        setDepositDescription('');
        triggerRefresh();
        setTimeout(() => {
          setDepositSuccess('');
          setDepositModalOpen(false);
        }, 1200);
      } else {
        setDepositError(data.error || 'Deposit failed');
      }
    } catch {
      setDepositError('Network error occurred during deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className={styles.layout}>
      {mobileMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        onOpenDeposit={() => setDepositModalOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <span className={styles.brandMobile}>NovaBank</span>
            <div className={styles.greeting}>
              Hello, <span className={styles.userNameHighlight}>{user?.name?.split(' ')[0] || 'there'}</span>
            </div>
          </div>

          <div className={styles.topbarRight}>
            <button
              onClick={togglePrivacyMode}
              className={styles.privacyBtn}
              title={privacyMode ? 'Show sensitive balances' : 'Hide sensitive balances'}
            >
              {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{privacyMode ? 'Hidden' : 'Privacy'}</span>
            </button>

            <button
              onClick={() => setDepositModalOpen(true)}
              className={styles.depositBtn}
            >
              <PlusCircle size={16} />
              <span>+ Deposit</span>
            </button>
          </div>
        </header>

        <div className={styles.container}>
          {children}
        </div>
      </main>

      {/* Global Quick Deposit Modal */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Deposit Funds"
        subtitle="Instantly add funds to any of your Nova accounts"
      >
        <form onSubmit={handleDepositSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Destination Account</label>
            <select
              value={depositAccountId}
              onChange={(e) => setDepositAccountId(e.target.value)}
              className={styles.select}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountType} • {acc.accountNumber} ({privacyMode ? '••••••' : `$${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Amount to Deposit</label>
            <div className={styles.amountWrapper}>
              <span className={styles.currency}>$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                required
                className={`${styles.input} ${styles.amountInput}`}
              />
            </div>
            <div className={styles.presetChips}>
              {['100', '500', '1000', '5000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDepositAmount(preset)}
                  className={styles.chip}
                >
                  +${preset}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Source / Category</label>
            <select
              value={depositCategory}
              onChange={(e) => setDepositCategory(e.target.value)}
              className={styles.select}
            >
              <option value="SALARY">Payroll & Salary</option>
              <option value="FREELANCE">Freelance / Consulting</option>
              <option value="INVESTMENT">Investment Yield / Dividends</option>
              <option value="CASH_DEPOSIT">External Bank Wire / Transfer</option>
              <option value="GENERAL">General Funds</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Description (Optional)</label>
            <input
              type="text"
              value={depositDescription}
              onChange={(e) => setDepositDescription(e.target.value)}
              placeholder="e.g. November Paycheck"
              className={styles.input}
            />
          </div>

          {depositError && (
            <div className={`${styles.modalFeedback} ${styles.errorFeedback}`}>
              {depositError}
            </div>
          )}

          {depositSuccess && (
            <div className={`${styles.modalFeedback} ${styles.successFeedback}`}>
              {depositSuccess}
            </div>
          )}

          <Button type="submit" loading={depositLoading} fullWidth>
            Confirm Deposit
          </Button>
        </form>
      </Modal>
    </div>
  );
}
