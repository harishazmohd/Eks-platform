'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import styles from './page.module.css';
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

interface Account {
  id: string;
  accountNumber: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  status: string;
  createdAt: string;
  account: Account;
}

export default function History() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (token) {
      fetch('/api/transactions/history', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setTransactions(data));
    }
  }, [token]);

  const filteredTx = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    if (filter === 'INCOMING') return tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN';
    if (filter === 'OUTGOING') return tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER_OUT';
    return true;
  });

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Transaction History</h1>
        <p className={styles.subtitle}>Review your recent financial activity.</p>
      </div>

      <Card className={styles.historyCard}>
        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            <Filter size={18} className={styles.filterIcon} />
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className={styles.select}
            >
              <option value="ALL">All Transactions</option>
              <option value="INCOMING">Incoming</option>
              <option value="OUTGOING">Outgoing</option>
            </select>
          </div>
        </div>

        <div className={styles.transactionList}>
          {filteredTx.length === 0 ? (
            <div className={styles.emptyState}>No transactions found.</div>
          ) : (
            filteredTx.map(tx => {
              const isIncoming = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN';
              return (
                <div key={tx.id} className={styles.transactionItem}>
                  <div className={`${styles.txIcon} ${isIncoming ? styles.txIncoming : styles.txOutgoing}`}>
                    {isIncoming ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className={styles.txDetails}>
                    <span className={styles.txDesc}>{tx.category}</span>
                    <span className={styles.txMeta}>
                      {new Date(tx.createdAt).toLocaleDateString()} • {tx.account.accountNumber}
                    </span>
                  </div>
                  <div className={styles.txStatus}>
                    <span className={`${styles.statusBadge} ${styles[tx.status.toLowerCase()]}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className={`${styles.txAmount} ${isIncoming ? styles.textSuccess : ''}`}>
                    {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
