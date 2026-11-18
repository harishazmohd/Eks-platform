'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card as UICard } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import styles from './page.module.css';
import {
  CreditCard,
  Lock,
  Globe,
  ShoppingCart,
  Sliders,
  Eye,
  EyeOff,
  Copy,
  Check,
  PiggyBank,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Plus
} from 'lucide-react';

interface CardItem {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  cardType: string;
  brand: string;
  label: string;
  isFrozen: boolean;
  dailyLimit: number;
  allowOnline: boolean;
  allowInternational: boolean;
  createdAt: string;
}

interface VaultItem {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  category: string;
  createdAt: string;
}

interface AccountItem {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

export default function CardsAndVaults() {
  const { token, user, privacyMode, triggerRefresh, refreshTrigger } = useAuth();

  // State
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [vaults, setVaults] = useState<VaultItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modals
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isNewVaultModalOpen, setIsNewVaultModalOpen] = useState(false);
  const [isDepositVaultModalOpen, setIsDepositVaultModalOpen] = useState(false);
  const [isWithdrawVaultModalOpen, setIsWithdrawVaultModalOpen] = useState(false);
  const [activeVault, setActiveVault] = useState<VaultItem | null>(null);

  // New Card Form
  const [newCardLabel, setNewCardLabel] = useState('');
  const [newCardBrand, setNewCardBrand] = useState('VISA');
  const [newCardLimit, setNewCardLimit] = useState('2500');

  // New Vault Form
  const [vaultName, setVaultName] = useState('');
  const [vaultTarget, setVaultTarget] = useState('');
  const [vaultInitialDeposit, setVaultInitialDeposit] = useState('');
  const [vaultFundingAccount, setVaultFundingAccount] = useState('');
  const [vaultCategory, setVaultCategory] = useState('SAVINGS');

  // Vault Deposit/Withdraw Form
  const [vaultActionAmount, setVaultActionAmount] = useState('');
  const [vaultActionAccount, setVaultActionAccount] = useState('');
  const [vaultSubmitting, setVaultSubmitting] = useState(false);
  const [vaultError, setVaultError] = useState('');

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    Promise.all([
      fetch('/api/cards', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/vaults', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([cardsRes, vaultsRes, accsRes]) => {
      if (!isMounted) return;

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        if (Array.isArray(cardsData)) {
          setCards(cardsData);
          setSelectedCardId((prev) => (prev ? prev : (cardsData.length > 0 ? cardsData[0].id : '')));
        }
      }

      if (vaultsRes.ok) {
        const vaultsData = await vaultsRes.json();
        if (Array.isArray(vaultsData)) {
          setVaults(vaultsData);
        }
      }

      if (accsRes.ok) {
        const accsData = await accsRes.json();
        if (Array.isArray(accsData)) {
          setAccounts(accsData);
          if (accsData.length > 0) {
            setVaultFundingAccount((prev) => (prev ? prev : accsData[0].id));
            setVaultActionAccount((prev) => (prev ? prev : accsData[0].id));
          }
        }
      }
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [token, refreshTrigger]);

  const currentCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Copy card number
  const handleCopyCard = () => {
    if (!currentCard) return;
    navigator.clipboard.writeText(currentCard.cardNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Toggle Freeze Card
  const handleToggleFreeze = async () => {
    if (!currentCard || !token) return;
    try {
      const res = await fetch(`/api/cards/${currentCard.id}/freeze`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCards((prev) => prev.map((c) => (c.id === currentCard.id ? data.card : c)));
        showNotification(data.message || 'Card updated');
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Card Settings
  const handleUpdateCardSettings = async (updates: Partial<CardItem>) => {
    if (!currentCard || !token) return;
    try {
      const res = await fetch(`/api/cards/${currentCard.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setCards((prev) => prev.map((c) => (c.id === currentCard.id ? data.card : c)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Terminate Card
  const handleDeleteCard = async () => {
    if (!currentCard || !token) return;
    if (cards.length <= 1) {
      alert('You cannot delete your only primary card.');
      return;
    }
    if (!confirm(`Are you sure you want to terminate "${currentCard.label}"? This action is permanent.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cards/${currentCard.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const remaining = cards.filter((c) => c.id !== currentCard.id);
        setCards(remaining);
        if (remaining.length > 0) setSelectedCardId(remaining[0].id);
        showNotification('Card terminated successfully');
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Issue New Card
  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/cards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          label: newCardLabel || (newCardBrand === 'VISA' ? 'Nova Virtual Visa' : 'Nova Virtual Mastercard'),
          brand: newCardBrand,
          dailyLimit: parseFloat(newCardLimit) || 2500,
          cardType: 'VIRTUAL'
        })
      });

      if (res.ok) {
        const newCard = await res.json();
        setCards((prev) => [...prev, newCard]);
        setSelectedCardId(newCard.id);
        setIsNewCardModalOpen(false);
        setNewCardLabel('');
        showNotification('New virtual card issued instantly!');
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Vault
  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setVaultSubmitting(true);
    setVaultError('');

    try {
      const res = await fetch('/api/vaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: vaultName,
          targetAmount: vaultTarget,
          initialDeposit: vaultInitialDeposit,
          accountId: vaultFundingAccount,
          category: vaultCategory
        })
      });

      if (res.ok) {
        const newVault = await res.json();
        setVaults((prev) => [newVault, ...prev]);
        setIsNewVaultModalOpen(false);
        setVaultName('');
        setVaultTarget('');
        setVaultInitialDeposit('');
        showNotification('Smart Vault created successfully!');
        triggerRefresh();
      } else {
        const errData = await res.json();
        setVaultError(errData.error || 'Failed to create vault');
      }
    } catch {
      setVaultError('Network error occurred');
    } finally {
      setVaultSubmitting(false);
    }
  };

  // Deposit to Vault
  const handleDepositToVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVault || !token) return;
    setVaultSubmitting(true);
    setVaultError('');

    try {
      const res = await fetch(`/api/vaults/${activeVault.id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: vaultActionAccount,
          amount: vaultActionAmount
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVaults((prev) => prev.map((v) => (v.id === activeVault.id ? data.vault : v)));
        setIsDepositVaultModalOpen(false);
        setVaultActionAmount('');
        showNotification(`Deposited $${parseFloat(vaultActionAmount).toFixed(2)} to ${activeVault.name}`);
        triggerRefresh();
      } else {
        const errData = await res.json();
        setVaultError(errData.error || 'Deposit failed');
      }
    } catch {
      setVaultError('Network error');
    } finally {
      setVaultSubmitting(false);
    }
  };

  // Withdraw from Vault
  const handleWithdrawFromVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVault || !token) return;
    setVaultSubmitting(true);
    setVaultError('');

    try {
      const res = await fetch(`/api/vaults/${activeVault.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: vaultActionAccount,
          amount: vaultActionAmount
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVaults((prev) => prev.map((v) => (v.id === activeVault.id ? data.vault : v)));
        setIsWithdrawVaultModalOpen(false);
        setVaultActionAmount('');
        showNotification(`Withdrawn $${parseFloat(vaultActionAmount).toFixed(2)} from ${activeVault.name}`);
        triggerRefresh();
      } else {
        const errData = await res.json();
        setVaultError(errData.error || 'Withdrawal failed');
      }
    } catch {
      setVaultError('Network error');
    } finally {
      setVaultSubmitting(false);
    }
  };

  // Delete Vault
  const handleDeleteVault = async (vault: VaultItem) => {
    if (!token) return;
    const confirmMsg = vault.currentAmount > 0
      ? `Close vault "${vault.name}"? The remaining $${vault.currentAmount.toFixed(2)} balance will be immediately refunded to your primary checking account.`
      : `Are you sure you want to close vault "${vault.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/vaults/${vault.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVaults((prev) => prev.filter((v) => v.id !== vault.id));
        showNotification(data.message || 'Vault closed successfully');
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCardNum = (num: string, reveal: boolean) => {
    if (!num) return '•••• •••• •••• ••••';
    if (reveal) {
      return num.replace(/(\d{4})/g, '$1 ').trim();
    }
    return `${num.slice(0, 4)} •••• •••• ${num.slice(-4)}`;
  };

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>Cards & Smart Vaults</h1>
            <p className={styles.subtitle}>
              Manage multi-currency virtual debit cards, spending locks, and automated savings targets.
            </p>
          </div>
          {actionMessage && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Check size={16} />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Carousel Selector */}
      <div className={styles.cardSelector}>
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.cardTab} ${c.id === (currentCard?.id) ? styles.cardTabActive : ''}`}
            onClick={() => setSelectedCardId(c.id)}
          >
            <CreditCard size={14} />
            <span>{c.label} ({c.brand})</span>
            {c.isFrozen && <Lock size={12} color="#f43f5e" />}
          </button>
        ))}
        <button
          type="button"
          className={styles.newCardTab}
          onClick={() => setIsNewCardModalOpen(true)}
        >
          <Plus size={14} />
          <span>+ Issue Card</span>
        </button>
      </div>

      <div className={styles.grid}>
        {/* Left: Card Display */}
        <div className={styles.cardCol}>
          {currentCard && (
            <div
              className={`${styles.cardContainer} ${currentCard.brand === 'MASTERCARD' ? styles.cardMastercard : styles.cardVisa} ${
                currentCard.isFrozen ? styles.cardFrozen : ''
              }`}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardBrand}>
                  <CreditCard size={20} color={currentCard.brand === 'MASTERCARD' ? '#fb923c' : '#818cf8'} />
                  <span>{currentCard.label}</span>
                </div>
                <span
                  className={`${styles.cardStatusPill} ${
                    currentCard.isFrozen ? styles.statusFrozen : styles.statusActive
                  }`}
                >
                  {currentCard.isFrozen ? 'Frozen' : 'Active'}
                </span>
              </div>

              <div className={styles.cardMiddle}>
                <div className={styles.cardChip} />
                <div className={styles.cardNumberRow}>
                  <span className={styles.cardNumber}>
                    {formatCardNum(currentCard.cardNumber, showCardDetails)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCardDetails(!showCardDetails)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    title={showCardDetails ? 'Hide card numbers' : 'Reveal card numbers'}
                  >
                    {showCardDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.cardBottom}>
                <div>
                  <div className={styles.cardHolderLabel}>Cardholder</div>
                  <div className={styles.cardHolderName}>
                    {currentCard.cardHolder || user?.name?.toUpperCase() || 'MEMBER'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.cardHolderLabel}>CVV / Exp</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#f8fafc' }}>
                    {showCardDetails ? `${currentCard.cvv} • ${currentCard.expiryDate}` : `••• • ${currentCard.expiryDate}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentCard && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleCopyCard}
                style={{ fontSize: '0.825rem' }}
              >
                {copiedNumber ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                <span>{copiedNumber ? 'Copied Number!' : 'Copy Card Number'}</span>
              </Button>
              <Button
                variant={currentCard.isFrozen ? 'primary' : 'danger'}
                fullWidth
                onClick={handleToggleFreeze}
                style={{ fontSize: '0.825rem' }}
              >
                <Lock size={15} />
                <span>{currentCard.isFrozen ? 'Unfreeze Card' : 'Freeze Card'}</span>
              </Button>
              {cards.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteCard}
                  title="Terminate Card"
                  style={{
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f43f5e',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Security & Spending Controls */}
        {currentCard && (
          <UICard className={styles.controlsCard}>
            <h2 className={styles.controlsTitle}>Card Controls: {currentCard.label}</h2>

            <div className={styles.controlList}>
              {/* Freeze Switch */}
              <div className={styles.controlItem}>
                <div className={styles.controlLeft}>
                  <div className={styles.controlIconWrapper}>
                    <Lock size={18} color="#f43f5e" />
                  </div>
                  <div className={styles.controlMeta}>
                    <span className={styles.controlName}>Card Lock / Freeze</span>
                    <span className={styles.controlDesc}>Instantly block all card authorisations</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${currentCard.isFrozen ? styles.toggleSwitchActive : ''}`}
                  onClick={handleToggleFreeze}
                  aria-label="Toggle card freeze"
                >
                  <span
                    className={`${styles.toggleKnob} ${currentCard.isFrozen ? styles.toggleKnobActive : ''}`}
                  />
                </button>
              </div>

              {/* Online Transactions */}
              <div className={styles.controlItem}>
                <div className={styles.controlLeft}>
                  <div className={styles.controlIconWrapper}>
                    <ShoppingCart size={18} color="#818cf8" />
                  </div>
                  <div className={styles.controlMeta}>
                    <span className={styles.controlName}>Online E-Commerce</span>
                    <span className={styles.controlDesc}>Authorize web and app subscriptions</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${currentCard.allowOnline ? styles.toggleSwitchActive : ''}`}
                  onClick={() => handleUpdateCardSettings({ allowOnline: !currentCard.allowOnline })}
                  aria-label="Toggle online transactions"
                >
                  <span
                    className={`${styles.toggleKnob} ${currentCard.allowOnline ? styles.toggleKnobActive : ''}`}
                  />
                </button>
              </div>

              {/* International Transactions */}
              <div className={styles.controlItem}>
                <div className={styles.controlLeft}>
                  <div className={styles.controlIconWrapper}>
                    <Globe size={18} color="#06b6d4" />
                  </div>
                  <div className={styles.controlMeta}>
                    <span className={styles.controlName}>International Usage</span>
                    <span className={styles.controlDesc}>Allow foreign currency settlements</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${currentCard.allowInternational ? styles.toggleSwitchActive : ''}`}
                  onClick={() => handleUpdateCardSettings({ allowInternational: !currentCard.allowInternational })}
                  aria-label="Toggle international usage"
                >
                  <span
                    className={`${styles.toggleKnob} ${
                      currentCard.allowInternational ? styles.toggleKnobActive : ''
                    }`}
                  />
                </button>
              </div>

              {/* Daily Limit Slider */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Sliders size={16} color="#fbbf24" />
                    <span>Daily Spending Cap</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f8fafc' }}>
                    ${currentCard.dailyLimit.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="250"
                  value={currentCard.dailyLimit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCards((prev) => prev.map((c) => (c.id === currentCard.id ? { ...c, dailyLimit: val } : c)));
                  }}
                  onMouseUp={(e) => handleUpdateCardSettings({ dailyLimit: Number((e.target as HTMLInputElement).value) })}
                  onTouchEnd={(e) => handleUpdateCardSettings({ dailyLimit: Number((e.target as HTMLInputElement).value) })}
                  style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
                />
              </div>
            </div>
          </UICard>
        )}
      </div>

      {/* Vaults & Goals Section */}
      <div className={styles.vaultsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Smart Savings Goals & Vaults</h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              High-yield automated reserves. Withdraw or deposit funds anytime with zero lock-in penalty.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsNewVaultModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <PlusCircle size={15} />
            <span>+ New Vault</span>
          </Button>
        </div>

        {vaults.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--card-bg)',
            border: '1px dashed var(--border-color)',
            borderRadius: '16px',
            color: '#94a3b8'
          }}>
            <PiggyBank size={36} color="#6366f1" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>No Active Vaults</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Create a targeted savings vault to track your financial goals.</p>
            <Button size="sm" onClick={() => setIsNewVaultModalOpen(true)}>Create Your First Vault</Button>
          </div>
        ) : (
          <div className={styles.vaultsGrid}>
            {vaults.map((vault) => {
              const percentage = Math.min(100, Math.round((vault.currentAmount / vault.targetAmount) * 100));
              return (
                <div key={vault.id} className={styles.vaultCard}>
                  <div className={styles.vaultTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className={styles.vaultIcon}>
                        <PiggyBank size={18} />
                      </div>
                      <span className={styles.vaultName}>{vault.name}</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: percentage >= 100 ? '#10b981' : '#38bdf8',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                    >
                      {percentage}%
                    </span>
                  </div>

                  <div className={styles.vaultProgressWrapper}>
                    <div className={styles.vaultBar}>
                      <div className={styles.vaultProgressFill} style={{ width: `${percentage}%` }} />
                    </div>
                    <div className={styles.vaultFigures}>
                      <span>
                        Saved:{' '}
                        <strong className={styles.vaultAmount}>
                          {privacyMode ? '••••' : `$${vault.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </strong>
                      </span>
                      <span>
                        Target:{' '}
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          ${vault.targetAmount.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Vault Actions */}
                  <div className={styles.vaultActions}>
                    <button
                      type="button"
                      className={styles.vaultBtn}
                      onClick={() => {
                        setActiveVault(vault);
                        setIsDepositVaultModalOpen(true);
                      }}
                    >
                      <ArrowDownRight size={13} color="#10b981" />
                      <span>Deposit</span>
                    </button>
                    <button
                      type="button"
                      className={styles.vaultBtn}
                      disabled={vault.currentAmount <= 0}
                      onClick={() => {
                        setActiveVault(vault);
                        setIsWithdrawVaultModalOpen(true);
                      }}
                    >
                      <ArrowUpRight size={13} color="#38bdf8" />
                      <span>Withdraw</span>
                    </button>
                    <button
                      type="button"
                      className={styles.vaultBtnDanger}
                      onClick={() => handleDeleteVault(vault)}
                      title="Close Vault"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Issue New Card */}
      <Modal
        isOpen={isNewCardModalOpen}
        onClose={() => setIsNewCardModalOpen(false)}
        title="Issue a New Virtual Card"
        subtitle="Create dedicated card numbers for online subscriptions, travel, or privacy"
      >
        <form onSubmit={handleIssueCard} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Card Name / Label</label>
            <input
              type="text"
              value={newCardLabel}
              onChange={(e) => setNewCardLabel(e.target.value)}
              placeholder="e.g. Netflix & Subscriptions, Tokyo Trip Card"
              required
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Payment Network</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setNewCardBrand('VISA')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: newCardBrand === 'VISA' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: newCardBrand === 'VISA' ? 'rgba(99, 102, 241, 0.15)' : '#0c1017',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Visa
              </button>
              <button
                type="button"
                onClick={() => setNewCardBrand('MASTERCARD')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: newCardBrand === 'MASTERCARD' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: newCardBrand === 'MASTERCARD' ? 'rgba(99, 102, 241, 0.15)' : '#0c1017',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mastercard
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Daily Spending Limit ($)</label>
            <input
              type="number"
              min="100"
              max="20000"
              value={newCardLimit}
              onChange={(e) => setNewCardLimit(e.target.value)}
              required
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            />
          </div>

          <Button type="submit" fullWidth>
            Issue Virtual Card
          </Button>
        </form>
      </Modal>

      {/* MODAL 2: Create Vault */}
      <Modal
        isOpen={isNewVaultModalOpen}
        onClose={() => setIsNewVaultModalOpen(false)}
        title="Create a Savings Vault"
        subtitle="Set a financial milestone and watch your progress compound"
      >
        <form onSubmit={handleCreateVault} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {vaultError && (
            <div style={{ color: '#f43f5e', fontSize: '0.85rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              {vaultError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Goal Name</label>
            <input
              type="text"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="e.g. Emergency Liquidity Reserve, Tokyo 2027"
              required
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Category</label>
            <select
              value={vaultCategory}
              onChange={(e) => setVaultCategory(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="SAVINGS">General Savings</option>
              <option value="EMERGENCY">Emergency Fund</option>
              <option value="TRAVEL">Vacation & Travel</option>
              <option value="TECH">Electronics & Tech</option>
              <option value="EDUCATION">Education & Career</option>
              <option value="HOME">Home & Living</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target Goal Amount</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', color: '#64748b', fontWeight: 600 }}>$</span>
              <input
                type="number"
                min="50"
                value={vaultTarget}
                onChange={(e) => setVaultTarget(e.target.value)}
                placeholder="5000"
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Initial Deposit (Optional)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', color: '#64748b', fontWeight: 600 }}>$</span>
              <input
                type="number"
                min="0"
                value={vaultInitialDeposit}
                onChange={(e) => setVaultInitialDeposit(e.target.value)}
                placeholder="0"
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

          {parseFloat(vaultInitialDeposit) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Source Account for Initial Deposit</label>
              <select
                value={vaultFundingAccount}
                onChange={(e) => setVaultFundingAccount(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#0c1017',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff'
                }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountType} • {a.accountNumber} (${a.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button type="submit" fullWidth disabled={vaultSubmitting}>
            {vaultSubmitting ? 'Creating Vault...' : 'Launch Savings Vault'}
          </Button>
        </form>
      </Modal>

      {/* MODAL 3: Deposit to Vault */}
      <Modal
        isOpen={isDepositVaultModalOpen}
        onClose={() => setIsDepositVaultModalOpen(false)}
        title={`Deposit into ${activeVault?.name}`}
        subtitle="Transfer funds from your bank account to lock into this savings goal"
      >
        <form onSubmit={handleDepositToVault} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {vaultError && (
            <div style={{ color: '#f43f5e', fontSize: '0.85rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              {vaultError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>From Account</label>
            <select
              value={vaultActionAccount}
              onChange={(e) => setVaultActionAccount(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff'
              }}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountType} • {a.accountNumber} (${a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Deposit Amount ($)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={vaultActionAmount}
              onChange={(e) => setVaultActionAmount(e.target.value)}
              placeholder="e.g. 250"
              required
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            />
          </div>

          <Button type="submit" fullWidth disabled={vaultSubmitting}>
            {vaultSubmitting ? 'Transferring...' : 'Confirm Deposit to Vault'}
          </Button>
        </form>
      </Modal>

      {/* MODAL 4: Withdraw from Vault */}
      <Modal
        isOpen={isWithdrawVaultModalOpen}
        onClose={() => setIsWithdrawVaultModalOpen(false)}
        title={`Withdraw from ${activeVault?.name}`}
        subtitle={`Available in vault: $${activeVault?.currentAmount.toFixed(2) || '0.00'}`}
      >
        <form onSubmit={handleWithdrawFromVault} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {vaultError && (
            <div style={{ color: '#f43f5e', fontSize: '0.85rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              {vaultError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Transfer Funds To Account</label>
            <select
              value={vaultActionAccount}
              onChange={(e) => setVaultActionAccount(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff'
              }}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountType} • {a.accountNumber} (${a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Withdrawal Amount ($)</label>
            <input
              type="number"
              min="1"
              max={activeVault?.currentAmount || 0}
              step="any"
              value={vaultActionAmount}
              onChange={(e) => setVaultActionAmount(e.target.value)}
              placeholder="e.g. 100"
              required
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#0c1017',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            />
          </div>

          <Button type="submit" fullWidth disabled={vaultSubmitting}>
            {vaultSubmitting ? 'Transferring...' : 'Withdraw to Account'}
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
