'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from './page.module.css';

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
}

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
}

export default function Transfer() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // New beneficiary form state
  const [newBenName, setNewBenName] = useState('');
  const [newBenAcc, setNewBenAcc] = useState('');
  const [showNewBen, setShowNewBen] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          setAccounts(data);
          if (data.length > 0) setFromAccountId(data[0].id);
        });

      fetch('/api/beneficiaries', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setBeneficiaries(data));
    }
  }, [token]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fromAccountId, toAccountNumber, amount }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Transfer successful!');
        setAmount('');
        setToAccountNumber('');
      } else {
        setError(data.error || 'Transfer failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    }
  };

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newBenName, accountNumber: newBenAcc }),
      });
      if (res.ok) {
        const ben = await res.json();
        setBeneficiaries([...beneficiaries, ben]);
        setNewBenName('');
        setNewBenAcc('');
        setShowNewBen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Transfer Funds</h1>
        <p className={styles.subtitle}>Send money securely to anyone.</p>
      </div>

      <div className={styles.grid}>
        <Card className={styles.transferCard}>
          <form onSubmit={handleTransfer} className={styles.form}>
            <div className={styles.formGroup}>
              <label>From Account</label>
              <select 
                value={fromAccountId} 
                onChange={(e) => setFromAccountId(e.target.value)}
                className={styles.input}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} (${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>To Account Number</label>
              <input
                type="text"
                value={toAccountNumber}
                onChange={(e) => setToAccountNumber(e.target.value)}
                placeholder="Enter account number or select beneficiary"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Amount</label>
              <div className={styles.amountInputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className={`${styles.input} ${styles.amountInput}`}
                />
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.success}>{message}</div>}

            <Button type="submit" fullWidth>Send Money</Button>
          </form>
        </Card>

        <div className={styles.sideCol}>
          <Card className={styles.beneficiariesCard}>
            <div className={styles.cardHeader}>
              <h3>Saved Beneficiaries</h3>
              <button 
                className={styles.textBtn}
                onClick={() => setShowNewBen(!showNewBen)}
              >
                {showNewBen ? 'Cancel' : '+ Add New'}
              </button>
            </div>
            
            {showNewBen && (
              <form onSubmit={handleAddBeneficiary} className={styles.newBenForm}>
                <input 
                  placeholder="Name" 
                  value={newBenName} 
                  onChange={e => setNewBenName(e.target.value)} 
                  className={styles.input} 
                  required 
                />
                <input 
                  placeholder="Account Number" 
                  value={newBenAcc} 
                  onChange={e => setNewBenAcc(e.target.value)} 
                  className={styles.input} 
                  required 
                />
                <Button type="submit" variant="secondary" fullWidth>Save</Button>
              </form>
            )}

            <div className={styles.benList}>
              {beneficiaries.map(ben => (
                <div 
                  key={ben.id} 
                  className={styles.benItem}
                  onClick={() => setToAccountNumber(ben.accountNumber)}
                >
                  <div className={styles.benAvatar}>{ben.name.charAt(0)}</div>
                  <div className={styles.benDetails}>
                    <span className={styles.benName}>{ben.name}</span>
                    <span className={styles.benAcc}>{ben.accountNumber}</span>
                  </div>
                </div>
              ))}
              {beneficiaries.length === 0 && !showNewBen && (
                <p className={styles.emptyText}>No saved beneficiaries.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
