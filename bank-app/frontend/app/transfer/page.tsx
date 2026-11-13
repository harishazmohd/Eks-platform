'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from './page.module.css';
import { Send, Receipt, Trash2, CheckCircle2, Building } from 'lucide-react';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
}

export default function Transfer() {
  const { token, privacyMode, triggerRefresh, refreshTrigger } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  // Mode: 'TRANSFER' | 'BILL_PAY'
  const [activeTab, setActiveTab] = useState<'TRANSFER' | 'BILL_PAY'>('TRANSFER');

  // Form State
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('TRANSFER');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Beneficiary Form State
  const [newBenName, setNewBenName] = useState('');
  const [newBenAcc, setNewBenAcc] = useState('');
  const [showNewBen, setShowNewBen] = useState(false);
  const [benLoading, setBenLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setAccounts(data);
              setFromAccountId((prev) => (prev ? prev : (data.length > 0 ? data[0].id : '')));
            }
          }
        })
        .catch(console.error);

      fetch('/api/beneficiaries', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setBeneficiaries(data);
          }
        })
        .catch(console.error);
    }
  }, [token, refreshTrigger]);

  const selectedAccount = accounts.find((a) => a.id === fromAccountId);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'BILL_PAY') {
        // Use withdrawal endpoint for bill pay
        const res = await fetch('/api/accounts/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accountId: fromAccountId,
            amount,
            category: 'UTILITIES',
            description: description || `Bill payment to ${toAccountNumber}`,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage('Bill payment processed successfully!');
          setAmount('');
          setDescription('');
          triggerRefresh();
        } else {
          setError(data.error || 'Bill payment failed');
        }
      } else {
        // Standard Transfer
        const res = await fetch('/api/transactions/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fromAccountId,
            toAccountNumber,
            amount,
            category,
            description,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage('Transfer settled instantly!');
          setAmount('');
          setToAccountNumber('');
          setDescription('');
          triggerRefresh();
        } else {
          setError(data.error || 'Transfer failed');
        }
      }
    } catch {
      setError('An error occurred during transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenLoading(true);
    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newBenName, accountNumber: newBenAcc }),
      });
      if (res.ok) {
        const ben = await res.json();
        setBeneficiaries((prev) => [ben, ...prev]);
        setNewBenName('');
        setNewBenAcc('');
        setShowNewBen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBenLoading(false);
    }
  };

  const handleDeleteBeneficiary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const billerPresets = [
    { name: 'Grid Electric & Power', acc: 'UTIL-ELEC-4091' },
    { name: 'Fiber Internet & 5G', acc: 'UTIL-NET-8821' },
    { name: 'Municipal Clean Water', acc: 'UTIL-WATR-1029' },
    { name: 'Cloud Infrastructure', acc: 'SERV-AWS-9042' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Transfer & Payments</h1>
        <p className={styles.subtitle}>Execute instant peer-to-peer settlements and automated utility bill payments.</p>
      </div>

      <div className={styles.grid}>
        {/* Main Transfer Card */}
        <Card className={styles.transferCard}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'TRANSFER' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('TRANSFER');
                setCategory('TRANSFER');
              }}
            >
              <Send size={16} />
              <span>P2P Transfer</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'BILL_PAY' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('BILL_PAY');
                setCategory('UTILITIES');
              }}
            >
              <Receipt size={16} />
              <span>Bill Pay & Utilities</span>
            </button>
          </div>

          <form onSubmit={handleTransfer} className={styles.form}>
            {/* From Account */}
            <div className={styles.formGroup}>
              <label>
                <span>From Account</span>
                {selectedAccount && (
                  <span style={{ color: '#94a3b8' }}>
                    Available: {privacyMode ? '••••••' : `$${selectedAccount.balance.toFixed(2)}`}
                  </span>
                )}
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className={styles.select}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountType} • {acc.accountNumber} ({privacyMode ? '••••••' : `$${acc.balance.toFixed(2)}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Account or Biller */}
            {activeTab === 'TRANSFER' ? (
              <div className={styles.formGroup}>
                <label>Recipient Account Number</label>
                <input
                  type="text"
                  value={toAccountNumber}
                  onChange={(e) => setToAccountNumber(e.target.value)}
                  placeholder="e.g. CHK-12345 or select from saved beneficiaries"
                  required
                  className={styles.input}
                />
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label>Select Utility Biller</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  {billerPresets.map((biller) => (
                    <button
                      key={biller.acc}
                      type="button"
                      onClick={() => {
                        setToAccountNumber(biller.acc);
                        setDescription(`Monthly bill for ${biller.name}`);
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: toAccountNumber === biller.acc ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: toAccountNumber === biller.acc ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        color: '#f8fafc',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Building size={14} color="#38bdf8" />
                      <span>{biller.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount */}
            <div className={styles.formGroup}>
              <label>Amount to Send</label>
              <div className={styles.amountInputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className={`${styles.input} ${styles.amountInput}`}
                />
              </div>
              <div className={styles.presetChips}>
                {['25', '50', '100', '250', '500'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={styles.chip}
                  >
                    ${preset}
                  </button>
                ))}
                {selectedAccount && selectedAccount.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(selectedAccount.balance.toFixed(2))}
                    className={styles.chip}
                    style={{ color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                  >
                    Max
                  </button>
                )}
              </div>
            </div>

            {/* Category Tagging */}
            {activeTab === 'TRANSFER' && (
              <div className={styles.formGroup}>
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles.select}
                >
                  <option value="TRANSFER">Direct Transfer</option>
                  <option value="GROCERIES">Groceries & Market</option>
                  <option value="RENT">Housing & Rent</option>
                  <option value="ENTERTAINMENT">Dining & Leisure</option>
                  <option value="GENERAL">General Miscellaneous</option>
                </select>
              </div>
            )}

            {/* Memo / Description */}
            <div className={styles.formGroup}>
              <label>Note / Reference (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Split dinner, invoice #104"
                className={styles.input}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {message && (
              <div className={styles.success}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">
              {activeTab === 'BILL_PAY' ? 'Confirm Bill Payment' : 'Execute Instant Transfer'}
            </Button>
          </form>
        </Card>

        {/* Side Column: Saved Beneficiaries */}
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
                  placeholder="Full Name"
                  value={newBenName}
                  onChange={(e) => setNewBenName(e.target.value)}
                  className={styles.input}
                  required
                />
                <input
                  placeholder="Account Number (e.g. CHK-12345)"
                  value={newBenAcc}
                  onChange={(e) => setNewBenAcc(e.target.value)}
                  className={styles.input}
                  required
                />
                <Button type="submit" loading={benLoading} size="sm" variant="secondary" fullWidth>
                  Save Beneficiary
                </Button>
              </form>
            )}

            <div className={styles.benList}>
              {beneficiaries.map((ben) => (
                <div
                  key={ben.id}
                  className={styles.benItem}
                  onClick={() => {
                    setToAccountNumber(ben.accountNumber);
                    setActiveTab('TRANSFER');
                  }}
                  title="Click to select this beneficiary"
                >
                  <div className={styles.benItemLeft}>
                    <div className={styles.benAvatar}>
                      {ben.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.benDetails}>
                      <span className={styles.benName}>{ben.name}</span>
                      <span className={styles.benAcc}>{ben.accountNumber}</span>
                    </div>
                  </div>

                  <button
                    className={styles.deleteBenBtn}
                    onClick={(e) => handleDeleteBeneficiary(ben.id, e)}
                    title="Delete beneficiary"
                    aria-label="Delete beneficiary"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {beneficiaries.length === 0 && !showNewBen && (
                <p className={styles.emptyText}>
                  No saved contacts yet. Add frequent payees for 1-click settlement.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
