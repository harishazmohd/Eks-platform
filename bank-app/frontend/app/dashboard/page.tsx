'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import styles from './page.module.css';
import { ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Landmark } from 'lucide-react';
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
  account: Account;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (token) {
      fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setAccounts(data));

      fetch('/api/transactions/history', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setTransactions(data.slice(0, 5)));
    }
  }, [token]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'CHECKING': return <Wallet size={24} />;
      case 'SAVINGS': return <Landmark size={24} />;
      case 'CREDIT': return <CreditCard size={24} />;
      default: return <Wallet size={24} />;
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, How are you{user?.name?.split(' ')[0]}</h1>
          <p className={styles.subtitle}>Here is your financial overview.</p>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <Card className={styles.totalBalanceCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Total Balance</span>
          </div>
          <div className={styles.cardAmount}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

      <h2 className={styles.sectionTitle}>Your Accounts</h2>
      <div className={styles.accountsGrid}>
        {accounts.map(acc => (
          <Card key={acc.id} className={styles.accountCard}>
            <div className={styles.accountHeader}>
              <div className={styles.accountIconWrapper}>
                {getIconForType(acc.accountType)}
              </div>
              <span className={styles.accountType}>{acc.accountType}</span>
            </div>
            <div className={styles.accountBalance}>
              ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className={styles.accountNumber}>{acc.accountNumber}</div>
          </Card>
        ))}
      </div>

      <div className={styles.recentTransactions}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <Link href="/history" className={styles.viewAll}>View All</Link>
        </div>
        <Card className={styles.transactionsCard}>
          {transactions.length === 0 ? (
            <div className={styles.emptyState}>No recent transactions</div>
          ) : (
            <div className={styles.transactionList}>
              {transactions.map(tx => {
                const isIncoming = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN';
                return (
                  <div key={tx.id} className={styles.transactionItem}>
                    <div className={`${styles.txIcon} ${isIncoming ? styles.txIncoming : styles.txOutgoing}`}>
                      {isIncoming ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className={styles.txDetails}>
                      <span className={styles.txDesc}>{tx.category}</span>
                      <span className={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={`${styles.txAmount} ${isIncoming ? styles.textSuccess : ''}`}>
                      {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
