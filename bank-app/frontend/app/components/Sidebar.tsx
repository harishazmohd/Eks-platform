'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Send,
  History,
  Landmark,
  CreditCard,
  PieChart,
  LogOut,
  Wallet,
  PlusCircle,
  X
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  onOpenDeposit?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ onOpenDeposit, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transfer & Pay', path: '/transfer', icon: Send },
    { name: 'Cards & Vaults', path: '/cards', icon: CreditCard },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'History', path: '/history', icon: History },
    { name: 'Loans & Credit', path: '/loans', icon: Landmark },
  ];

  return (
    <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.logo} onClick={onCloseMobile}>
          <div className={styles.logoIconWrapper}>
            <Wallet size={20} />
          </div>
          <span className={styles.logoText}>NovaBank</span>
          <span className={styles.badge}>Pro</span>
        </Link>
        {onCloseMobile && (
          <button className={styles.mobileClose} onClick={onCloseMobile} aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        <span className={styles.navCategory}>Navigation</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onCloseMobile}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <div className={styles.navItemLeft}>
                <Icon size={18} />
                <span>{item.name}</span>
              </div>
              {isActive && <span className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      {onOpenDeposit && (
        <div className={styles.depositAction}>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenDeposit();
            }}
            className={styles.quickDepositBtn}
          >
            <PlusCircle size={16} />
            <span>Quick Deposit Funds</span>
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'User'}</span>
            <span className={styles.userStatus}>
              <span className={styles.statusDot} />
              Active Member
            </span>
          </div>
        </div>
        <button onClick={logout} className={styles.logoutBtn} title="Sign out" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
