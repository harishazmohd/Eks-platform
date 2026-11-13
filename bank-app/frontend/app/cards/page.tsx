'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
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
  PlusCircle
} from 'lucide-react';

interface Vault {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  category: string;
}

export default function CardsAndVaults() {
  const { user, privacyMode } = useAuth();

  // Card Controls State
  const [isFrozen, setIsFrozen] = useState(false);
  const [allowOnline, setAllowOnline] = useState(true);
  const [allowInternational, setAllowInternational] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(2500);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Vaults State
  const [vaults, setVaults] = useState<Vault[]>([
    { id: '1', name: 'Emergency Liquidity Reserve', currentAmount: 4500, targetAmount: 10000, category: 'EMERGENCY' },
    { id: '2', name: 'Tokyo 2027 Expedition', currentAmount: 1850, targetAmount: 3500, category: 'TRAVEL' },
    { id: '3', name: 'Hardware & Workstation', currentAmount: 900, targetAmount: 1200, category: 'TECH' },
  ]);

  // New Vault Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');

  const handleCopyCard = () => {
    navigator.clipboard.writeText('4829771209349214');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCreateVault = (e: React.FormEvent) => {
    e.preventDefault();
    const newVault: Vault = {
      id: String(Date.now()),
      name: vaultName,
      currentAmount: parseFloat(initialAmount) || 0,
      targetAmount: parseFloat(targetAmount) || 1000,
      category: 'SAVINGS'
    };
    setVaults([newVault, ...vaults]);
    setVaultName('');
    setTargetAmount('');
    setInitialAmount('');
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Cards & Smart Vaults</h1>
        <p className={styles.subtitle}>Manage your virtual debit cards, security switches, and automated savings targets.</p>
      </div>

      <div className={styles.grid}>
        {/* Left: Card Display */}
        <div className={styles.cardCol}>
          <div className={`${styles.cardContainer} ${isFrozen ? styles.cardFrozen : ''}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardBrand}>
                <CreditCard size={20} color="#818cf8" />
                <span>Nova Infinite</span>
              </div>
              <span className={`${styles.cardStatusPill} ${isFrozen ? styles.statusFrozen : styles.statusActive}`}>
                {isFrozen ? 'Frozen' : 'Active'}
              </span>
            </div>

            <div className={styles.cardMiddle}>
              <div className={styles.cardChip} />
              <div className={styles.cardNumberRow}>
                <span className={styles.cardNumber}>
                  {showCardDetails ? '4829 7712 0934 9214' : '4829 •••• •••• 9214'}
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
                  {user?.name?.toUpperCase() || 'ALEX MORGAN'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.cardHolderLabel}>CVV / Exp</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#f8fafc' }}>
                  {showCardDetails ? '842 • 08/29' : '••• • 08/29'}
                </div>
              </div>
            </div>
          </div>

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
              variant={isFrozen ? 'primary' : 'danger'}
              fullWidth
              onClick={() => setIsFrozen(!isFrozen)}
              style={{ fontSize: '0.825rem' }}
            >
              <Lock size={15} />
              <span>{isFrozen ? 'Unfreeze Card' : 'Freeze Card'}</span>
            </Button>
          </div>
        </div>

        {/* Right: Security & Spending Controls */}
        <Card className={styles.controlsCard}>
          <h2 className={styles.controlsTitle}>Card Security & Limits</h2>

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
                className={`${styles.toggleSwitch} ${isFrozen ? styles.toggleSwitchActive : ''}`}
                onClick={() => setIsFrozen(!isFrozen)}
                aria-label="Toggle card freeze"
              >
                <span className={`${styles.toggleKnob} ${isFrozen ? styles.toggleKnobActive : ''}`} />
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
                className={`${styles.toggleSwitch} ${allowOnline ? styles.toggleSwitchActive : ''}`}
                onClick={() => setAllowOnline(!allowOnline)}
                aria-label="Toggle online transactions"
              >
                <span className={`${styles.toggleKnob} ${allowOnline ? styles.toggleKnobActive : ''}`} />
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
                className={`${styles.toggleSwitch} ${allowInternational ? styles.toggleSwitchActive : ''}`}
                onClick={() => setAllowInternational(!allowInternational)}
                aria-label="Toggle international usage"
              >
                <span className={`${styles.toggleKnob} ${allowInternational ? styles.toggleKnobActive : ''}`} />
              </button>
            </div>

            {/* Daily Limit Slider */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Sliders size={16} color="#fbbf24" />
                  <span>Daily Spending Cap</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f8fafc' }}>
                  ${dailyLimit.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Vaults & Goals Section */}
      <div className={styles.vaultsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Smart Savings Goals & Vaults</h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              Segregate funds with 4.75% annual compounding interest.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <PlusCircle size={15} />
            <span>+ New Vault</span>
          </Button>
        </div>

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
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: percentage >= 100 ? '#10b981' : '#38bdf8',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {percentage}%
                  </span>
                </div>

                <div className={styles.vaultProgressWrapper}>
                  <div className={styles.vaultBar}>
                    <div className={styles.vaultProgressFill} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className={styles.vaultFigures}>
                    <span>Saved: <strong className={styles.vaultAmount}>
                      {privacyMode ? '••••' : `$${vault.currentAmount.toLocaleString()}`}
                    </strong></span>
                    <span>Target: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ${vault.targetAmount.toLocaleString()}
                    </span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Vault Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create a Savings Vault"
        subtitle="Set a financial milestone and watch your progress compound"
      >
        <form onSubmit={handleCreateVault} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Goal Name</label>
            <input
              type="text"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="e.g. New Electric Vehicle Fund"
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
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target Goal Amount</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', color: '#64748b', fontWeight: 600 }}>$</span>
              <input
                type="number"
                min="100"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
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
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Initial Allocation</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', color: '#64748b', fontWeight: 600 }}>$</span>
              <input
                type="number"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="250"
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

          <Button type="submit" fullWidth>
            Launch Savings Vault
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
