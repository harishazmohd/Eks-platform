'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import styles from './page.module.css';
import {
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  Send,
  PlusCircle,
  TrendingUp,
  Copy,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  createdAt: string;
  description?: string;
  account: Account;
}

interface AnalyticsData {
  totalBalance: number;
  totalInflow: number;
  totalOutflow: number;
  savingsRate: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}

export default function Dashboard() {
  const { token, user, privacyMode, refreshTrigger, triggerRefresh } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [copiedAcc, setCopiedAcc] = useState<string | null>(null);

  // New Account Modal State
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccType, setNewAccType] = useState('SAVINGS');
  const [newAccDeposit, setNewAccDeposit] = useState('');
  const [newAccLoading, setNewAccLoading] = useState(false);
  const [newAccError, setNewAccError] = useState('');

  useEffect(() => {
    if (token) {
      // 1. Fetch Accounts
      fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setAccounts(data);
          }
        })
        .catch(console.error);

      // 2. Fetch Recent Transactions
      fetch('/api/transactions/history', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setTransactions(data.slice(0, 6));
          }
        })
        .catch(console.error);

      // 3. Fetch Analytics
      fetch('/api/analytics/summary', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setAnalytics(data);
          }
        })
        .catch(console.error);
    }
  }, [token, refreshTrigger]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const handleCopyAccount = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAcc(accNum);
    setTimeout(() => setCopiedAcc(null), 2000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewAccError('');
    setNewAccLoading(true);

    try {
      const res = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountType: newAccType,
          initialDeposit: newAccDeposit || '0',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsNewAccountModalOpen(false);
        setNewAccDeposit('');
        triggerRefresh();
      } else {
        setNewAccError(data.error || 'Failed to create account');
      }
    } catch {
      setNewAccError('Network error occurred');
    } finally {
      setNewAccLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'CHECKING': return <Wallet size={20} />;
      case 'SAVINGS': return <Landmark size={20} />;
      case 'CREDIT': return <CreditCard size={20} />;
      case 'VAULT': return <PiggyBank size={20} />;
      default: return <Wallet size={20} />;
    }
  };

  const categoryColors: Record<string, string> = {
    SALARY: '#10b981',
    TRANSFER: '#6366f1',
    GROCERIES: '#f59e0b',
    UTILITIES: '#ec4899',
    GENERAL: '#94a3b8',
    LOAN_DISBURSEMENT: '#06b6d4',
    LOAN_REPAYMENT: '#f43f5e',
  };

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <div className={styles.welcomeText}>
          <h1 className={styles.title}>
            Welcome back, {user?.name?.split(' ')[0] || 'Member'}
          </h1>
          <p className={styles.subtitle}>
            Your capital is performing at peak efficiency. Here is your unified overview.
          </p>
        </div>
      </div>

      {/* Net Worth Overview Banner */}
      <div className={styles.overviewCard}>
        <div className={styles.netWorthSection}>
          <div className={styles.labelRow}>
            <span>Total Liquid Net Worth</span>
            {analytics?.savingsRate ? (
              <span style={{ color: '#10b981', fontWeight: 600 }}>• {analytics.savingsRate}% Savings Rate</span>
            ) : null}
          </div>
          <div className={styles.totalAmount}>
            {privacyMode ? '••••••••' : `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>

        <div className={styles.cashflowPills}>
          <div className={styles.flowPill}>
            <div className={styles.flowIconIn}>
              <ArrowDownRight size={18} />
            </div>
            <div className={styles.flowMeta}>
              <span className={styles.flowLabel}>Total Inflow</span>
              <span className={styles.flowValue} style={{ color: '#10b981' }}>
                {privacyMode ? '••••••' : `+$${(analytics?.totalInflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>

          <div className={styles.flowPill}>
            <div className={styles.flowIconOut}>
              <ArrowUpRight size={18} />
            </div>
            <div className={styles.flowMeta}>
              <span className={styles.flowLabel}>Total Outflow</span>
              <span className={styles.flowValue} style={{ color: '#f43f5e' }}>
                {privacyMode ? '••••••' : `-$${(analytics?.totalOutflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className={styles.actionsBar}>
        <Link href="/transfer" className={styles.actionBtn}>
          <div className={styles.actionIconWrapper} style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Send size={18} />
          </div>
          <span>Send Money</span>
        </Link>

        <button onClick={() => setIsNewAccountModalOpen(true)} className={styles.actionBtn}>
          <div className={styles.actionIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <PlusCircle size={18} />
          </div>
          <span>New Account</span>
        </button>

        <Link href="/cards" className={styles.actionBtn}>
          <div className={styles.actionIconWrapper} style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            <CreditCard size={18} />
          </div>
          <span>Virtual Cards</span>
        </Link>

        <Link href="/loans" className={styles.actionBtn}>
          <div className={styles.actionIconWrapper} style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <TrendingUp size={18} />
          </div>
          <span>Instant Credit</span>
        </Link>
      </div>

      {/* Accounts Carousel / Grid */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Your Portfolios & Accounts</h2>
        <button
          onClick={() => setIsNewAccountModalOpen(true)}
          style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer' }}
        >
          + Open Account
        </button>
      </div>

      <div className={styles.accountsGrid}>
        {accounts.map((acc) => (
          <div key={acc.id} className={styles.accountCard}>
            <div className={styles.accountTop}>
              <div className={styles.accountIconWrapper}>
                {getIconForType(acc.accountType)}
              </div>
              <span className={styles.accountTypeBadge}>{acc.accountType}</span>
            </div>

            <div className={styles.accountBalance}>
              {privacyMode ? '••••••' : `$${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>

            <div className={styles.accountFooter}>
              <span
                className={styles.accountNumber}
                onClick={() => handleCopyAccount(acc.accountNumber)}
                title="Click to copy account number"
              >
                {acc.accountNumber}
                {copiedAcc === acc.accountNumber ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              </span>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Active</span>
            </div>
          </div>
        ))}

        {/* Add Account Card */}
        <div
          className={styles.addAccountCard}
          onClick={() => setIsNewAccountModalOpen(true)}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PlusCircle size={22} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Create New Vault</span>
        </div>
      </div>

      {/* Two Column Grid: Recent Activity & Insights */}
      <div className={styles.dashboardGrid}>
        {/* Left: Recent Activity */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <Link href="/history" className={styles.viewAll}>
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <Card className={styles.transactionsCard}>
            {transactions.length === 0 ? (
              <div className={styles.emptyState}>No transaction history yet.</div>
            ) : (
              <div className={styles.transactionList}>
                {transactions.map((tx) => {
                  const isIncoming = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN';
                  return (
                    <div key={tx.id} className={styles.transactionItem}>
                      <div className={styles.txLeft}>
                        <div className={`${styles.txIcon} ${isIncoming ? styles.txIncoming : styles.txOutgoing}`}>
                          {isIncoming ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div className={styles.txDetails}>
                          <span className={styles.txDesc}>
                            {tx.description || tx.category}
                          </span>
                          <span className={styles.txMeta}>
                            {new Date(tx.createdAt).toLocaleDateString()} • {tx.account?.accountNumber || 'Account'}
                          </span>
                        </div>
                      </div>

                      <div className={`${styles.txAmount} ${isIncoming ? styles.textSuccess : ''}`}>
                        {privacyMode ? '••••••' : `${isIncoming ? '+' : '-'}$${tx.amount.toFixed(2)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Spending Breakdown */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Spending Breakdown</h2>
            <Link href="/analytics" className={styles.viewAll}>
              <span>Analytics</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <Card className={styles.insightsCard}>
            {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
              <>
                <div className={styles.categoryBar}>
                  {analytics.categoryBreakdown.map((cat) => (
                    <div
                      key={cat.category}
                      className={styles.categoryBarSegment}
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: categoryColors[cat.category] || '#6366f1',
                      }}
                      title={`${cat.category}: ${cat.percentage}%`}
                    />
                  ))}
                </div>

                <div className={styles.categoryList}>
                  {analytics.categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.category} className={styles.categoryItem}>
                      <div className={styles.catLeft}>
                        <span
                          className={styles.catDot}
                          style={{ backgroundColor: categoryColors[cat.category] || '#6366f1' }}
                        />
                        <span className={styles.catName}>{cat.category}</span>
                      </div>
                      <span className={styles.catAmount}>
                        {privacyMode ? '••••' : `$${cat.amount.toFixed(2)} (${cat.percentage}%)`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                <Sparkles size={24} style={{ marginBottom: '0.5rem', color: '#818cf8' }} />
                <p>Transfer or spend funds to populate automated category analytics.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Account Modal */}
      <Modal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        title="Open a New Account"
        subtitle="Diversify your capital with dedicated savings, credit, or vault accounts"
      >
        <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Account Type</label>
            <select
              value={newAccType}
              onChange={(e) => setNewAccType(e.target.value)}
              style={{
                padding: '0.75rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="SAVINGS">High-Yield Savings (4.75% APY)</option>
              <option value="CHECKING">Standard Checking (Everyday Debit)</option>
              <option value="VAULT">Emergency Liquidity Vault</option>
              <option value="CREDIT">Revolving Credit Line</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Initial Deposit (Optional)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', color: '#64748b', fontWeight: 600 }}>$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newAccDeposit}
                onChange={(e) => setNewAccDeposit(e.target.value)}
                placeholder="0.00"
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
          </div>

          {newAccError && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              fontSize: '0.85rem'
            }}>
              {newAccError}
            </div>
          )}

          <Button type="submit" loading={newAccLoading} fullWidth>
            Create Account Now
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
