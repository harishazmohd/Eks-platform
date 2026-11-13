'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import styles from './page.module.css';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  PiggyBank,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface AnalyticsData {
  totalBalance: number;
  totalInflow: number;
  totalOutflow: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}

export default function AnalyticsPage() {
  const { token, privacyMode } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (token) {
      fetch('/api/analytics/summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json();
            setData(json);
          }
        })
        .catch(console.error);
    }
  }, [token]);

  const categoryColors: Record<string, string> = {
    SALARY: '#10b981',
    TRANSFER: '#6366f1',
    GROCERIES: '#f59e0b',
    UTILITIES: '#ec4899',
    GENERAL: '#94a3b8',
    LOAN_DISBURSEMENT: '#06b6d4',
    LOAN_REPAYMENT: '#f43f5e',
  };

  // Simulated 5-month Cashflow comparison
  const monthlyFlow = [
    { month: 'Jul', in: 3200, out: 1400 },
    { month: 'Aug', in: 4100, out: 2100 },
    { month: 'Sep', in: 3800, out: 1800 },
    { month: 'Oct', in: 4500, out: 2200 },
    { month: 'Nov', in: data?.totalInflow || 5000, out: data?.totalOutflow || 1800 },
  ];

  const maxVal = Math.max(...monthlyFlow.map(m => Math.max(m.in, m.out)), 5000);

  return (
    <DashboardLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Financial Intelligence</h1>
        <p className={styles.subtitle}>Real-time capital velocity, monthly cash flow vectors, and automated expense attribution.</p>
      </div>

      {/* KPI Cards Row */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Net Savings Rate</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Percent size={16} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: '#818cf8' }}>
            {data?.savingsRate || 72}%
          </div>
          <span className={styles.kpiFooter}>High efficiency tier</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Inflow</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: '#34d399' }}>
            {privacyMode ? '••••••' : `$${(data?.totalInflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
          <span className={styles.kpiFooter}>Deposits & Transfers In</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Outflow</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: '#f43f5e' }}>
            {privacyMode ? '••••••' : `$${(data?.totalOutflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
          <span className={styles.kpiFooter}>Debits & Transfers Out</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Net Retention</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
              <PiggyBank size={16} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: '#38bdf8' }}>
            {privacyMode ? '••••••' : `$${(data?.netSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
          <span className={styles.kpiFooter}>Positive capital growth</span>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className={styles.mainGrid}>
        {/* Left: Cashflow History Visualizer */}
        <Card className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Monthly Cashflow Performance</h2>
          <p className={styles.chartSubtitle}>Inflow vs Outflow trend across recent billing cycles</p>

          <div className={styles.chartContainer}>
            {monthlyFlow.map((flow) => {
              const inHeight = Math.max(12, Math.round((flow.in / maxVal) * 150));
              const outHeight = Math.max(12, Math.round((flow.out / maxVal) * 150));
              return (
                <div key={flow.month} className={styles.chartCol}>
                  <div className={styles.barsGroup}>
                    <div
                      className={styles.barInflow}
                      style={{ height: `${inHeight}px` }}
                      title={`Inflow: $${flow.in}`}
                    />
                    <div
                      className={styles.barOutflow}
                      style={{ height: `${outHeight}px` }}
                      title={`Outflow: $${flow.out}`}
                    />
                  </div>
                  <span className={styles.colLabel}>{flow.month}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.chartLegend}>
            <div>
              <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
              <span>Capital Inflow</span>
            </div>
            <div>
              <span className={styles.legendDot} style={{ backgroundColor: '#f43f5e' }} />
              <span>Capital Outflow</span>
            </div>
          </div>
        </Card>

        {/* Right: Category Distribution */}
        <Card className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Expenditure by Category</h2>
          <p className={styles.chartSubtitle}>Categorized outflow metrics</p>

          {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
            <div className={styles.categoryList}>
              {data.categoryBreakdown.map((item) => (
                <div key={item.category} className={styles.catRow}>
                  <div className={styles.catHeader}>
                    <span style={{ color: '#f8fafc', fontWeight: 500 }}>{item.category}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                      {privacyMode ? '••••' : `$${item.amount.toFixed(2)} (${item.percentage}%)`}
                    </span>
                  </div>
                  <div className={styles.catBarBg}>
                    <div
                      className={styles.catBarFill}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: categoryColors[item.category] || '#6366f1'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <Sparkles size={24} style={{ color: '#818cf8', marginBottom: '0.5rem' }} />
              <p>Execute transactions to automatically populate live spending categories.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Financial Health Score Banner */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreLeft}>
          <div className={styles.scoreCircle}>
            96
          </div>
          <div className={styles.scoreDetails}>
            <h3>Exceptional Capital Discipline</h3>
            <p>
              Your outflow-to-inflow ratio qualifies your profile for lowest tier credit APR and instant loan approvals.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontSize: '0.8rem',
            color: '#34d399'
          }}>
            <ShieldCheck size={16} />
            <span>Top 2% Saver</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontSize: '0.8rem',
            color: '#38bdf8'
          }}>
            <CheckCircle2 size={16} />
            <span>Zero Debt Default Risk</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
