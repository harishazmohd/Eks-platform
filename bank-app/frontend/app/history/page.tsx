'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import styles from './page.module.css';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  FileSpreadsheet
} from 'lucide-react';

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
  description?: string;
  createdAt: string;
  account: Account;
}

export default function HistoryPage() {
  const { token, privacyMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (token) {
      fetch('/api/transactions/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setTransactions(data);
          }
        })
        .catch(console.error);
    }
  }, [token]);

  const filteredTransactions = transactions.filter((tx) => {
    // Type filter
    if (typeFilter === 'INCOMING') {
      if (tx.type !== 'DEPOSIT' && tx.type !== 'TRANSFER_IN') return false;
    }
    if (typeFilter === 'OUTGOING') {
      if (tx.type !== 'WITHDRAWAL' && tx.type !== 'TRANSFER_OUT') return false;
    }

    // Category filter
    if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchCat = (tx.category || '').toLowerCase().includes(q);
      const matchAcc = (tx.account?.accountNumber || '').toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      if (!matchDesc && !matchCat && !matchAcc && !matchAmount) {
        return false;
      }
    }

    return true;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Account Number', 'Status', 'Amount'];
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.createdAt).toISOString(),
      tx.type,
      tx.category,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.account?.accountNumber || '',
      tx.status,
      tx.amount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `novabank_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = Array.from(new Set(transactions.map((t) => t.category).filter(Boolean)));

  const totalFilteredVolume = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Transaction Ledger</h1>
          <p className={styles.subtitle}>Audit and query every incoming and outgoing capital movement with millisecond precision.</p>
        </div>

        <button onClick={exportCSV} className={styles.exportBtn} title="Download CSV ledger">
          <Download size={16} />
          <span>Export CSV Statement</span>
        </button>
      </div>

      <Card className={styles.historyCard}>
        {/* Filter Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, account, or amount..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filtersGroup}>
            <div className={styles.typePills}>
              <button
                type="button"
                className={`${styles.pillBtn} ${typeFilter === 'ALL' ? styles.pillActive : ''}`}
                onClick={() => setTypeFilter('ALL')}
              >
                All Flows
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${typeFilter === 'INCOMING' ? styles.pillActive : ''}`}
                onClick={() => setTypeFilter('INCOMING')}
              >
                Inflow
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${typeFilter === 'OUTGOING' ? styles.pillActive : ''}`}
                onClick={() => setTypeFilter('OUTGOING')}
              >
                Outflow
              </button>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.select}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Metadata */}
        <div className={styles.resultsMeta}>
          <span>Showing {filteredTransactions.length} of {transactions.length} entries</span>
          <span>
            Matching Volume: {privacyMode ? '••••••' : `$${totalFilteredVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        {/* Transaction Rows */}
        <div className={styles.transactionList}>
          {filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <FileSpreadsheet size={32} style={{ marginBottom: '0.75rem', color: '#64748b' }} />
              <p>No transactions match your search or filter criteria.</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncoming = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN';
              return (
                <div key={tx.id} className={styles.transactionItem}>
                  <div className={styles.txLeft}>
                    <div className={`${styles.txIcon} ${isIncoming ? styles.txIncoming : styles.txOutgoing}`}>
                      {isIncoming ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className={styles.txDetails}>
                      <span className={styles.txDesc}>{tx.description || tx.category}</span>
                      <div className={styles.txMeta}>
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{tx.account?.accountNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.txRight}>
                    <span className={styles.statusBadge}>
                      {tx.status}
                    </span>
                    <span className={`${styles.txAmount} ${isIncoming ? styles.textSuccess : ''}`}>
                      {privacyMode ? '••••••' : `${isIncoming ? '+' : '-'}$${tx.amount.toFixed(2)}`}
                    </span>
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
