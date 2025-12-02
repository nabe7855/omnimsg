"use client";

import React, { useState, useMemo } from 'react';
import { Users, AlertTriangle, Scale, Activity, Store, Star, User as UserIcon, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './dashboard.module.css'; // CSS Modules import

// ※ダミーデータや型定義は実際のファイルの場所に合わせてimportしてください
import { MOCK_USERS, MOCK_REPORTS, MOCK_INQUIRIES, MOCK_CHART_DATA } from '@/adminconstants'; 
import { ReportStatus, InquiryType, UserRole } from '@/lib/types'; // パスは適宜修正

type TimeRange = '7' | '30' | '90';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7');

  // KPI計算
  const totalUsers = MOCK_USERS.length;
  const countUser = MOCK_USERS.filter(u => u.role === UserRole.USER).length;
  const countCast = MOCK_USERS.filter(u => u.role === UserRole.CAST).length;
  const countStore = MOCK_USERS.filter(u => u.role === UserRole.STORE).length;

  const pendingReports = MOCK_REPORTS.filter(r => r.status === ReportStatus.PENDING).length;
  const pendingLegal = MOCK_INQUIRIES.filter(i => i.type === InquiryType.LEGAL && i.status === 'OPEN').length;

  // チャートデータのフィルタリング
  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    return MOCK_CHART_DATA.slice(-days);
  }, [timeRange]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>ダッシュボード</h2>
        <div className={styles.dateBadge}>
          <Calendar className={styles.dateIcon} />
          {new Date().toLocaleDateString('ja-JP')} 現在
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* User Stats Breakdown Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardLabel}>総アカウント数</p>
              <h3 className={styles.cardValue}>{totalUsers.toLocaleString()}</h3>
            </div>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperBlue}`}>
              <Users size={24} />
            </div>
          </div>
          {/* Breakdown */}
          <div className={styles.userBreakdown}>
            <div className={styles.breakdownItem}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '4px'}}>
                <UserIcon size={16} color="#3b82f6" />
              </div>
              <p className={styles.breakdownLabel}>一般</p>
              <p className={styles.breakdownValue}>{countUser}</p>
            </div>
            <div className={styles.breakdownItem}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '4px'}}>
                <Star size={16} color="#ec4899" />
              </div>
              <p className={styles.breakdownLabel}>CAST</p>
              <p className={styles.breakdownValue}>{countCast}</p>
            </div>
            <div className={styles.breakdownItem}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '4px'}}>
                <Store size={16} color="#6366f1" />
              </div>
              <p className={styles.breakdownLabel}>店舗</p>
              <p className={styles.breakdownValue}>{countStore}</p>
            </div>
          </div>
        </div>

        <KPICard 
          title="未対応の通報" 
          value={pendingReports.toString()} 
          icon={AlertTriangle} 
          iconStyle={styles.iconBgRed}
          isAlert={pendingReports > 0}
        />
        <KPICard 
          title="法的削除依頼" 
          value={pendingLegal.toString()} 
          icon={Scale} 
          iconStyle={styles.iconBgPurple}
          isAlert={pendingLegal > 0}
        />
        <KPICard 
          title="サーバー稼働状況" 
          value="99.9%" 
          icon={Activity} 
          iconStyle={styles.iconBgGreen}
        />
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Chart Section */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>属性別・新規登録推移</h3>
            <div className={styles.timeRangeSelector}>
              {(['7', '30', '90'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`${styles.timeRangeBtn} ${timeRange === range ? styles.timeRangeBtnActive : ''}`}
                >
                  {range}日
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickMargin={10}
                  interval={timeRange === '90' ? 6 : timeRange === '30' ? 2 : 0} 
                />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}/>
                
                <Bar dataKey="user" name="一般User" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="cast" name="Cast" stackId="a" fill="#ec4899" />
                <Bar dataKey="store" name="店舗" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartFooter}>
             <Activity size={16} className="text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
             <p>
               チャートは各カテゴリーの新規登録数を積み上げて表示しています。
             </p>
          </div>
        </div>

        {/* Todo List / Alerts */}
        <div className={styles.todoSection}>
          <h3 className={styles.todoTitle}>
            <AlertTriangle size={20} className="text-red-500 mr-2" />
            要対応アクション
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingReports > 0 && (
              <div className={`${styles.alertBox} ${styles.alertRed} ${styles.pulse}`}>
                <div>
                  <p className={`${styles.alertTitle} text-red-700`}>新規通報あり</p>
                  <p className={`${styles.alertDesc} text-red-600`}>{pendingReports}件の通報が未確認です。</p>
                </div>
                <button className={`${styles.actionBtn} ${styles.btnRed}`}>確認</button>
              </div>
            )}
            {pendingLegal > 0 && (
              <div className={`${styles.alertBox} ${styles.alertPurple}`}>
                <div>
                  <p className={`${styles.alertTitle} text-purple-700`}>削除依頼 (Pro.法)</p>
                  <p className={`${styles.alertDesc} text-purple-600`}>{pendingLegal}件の法的対応が必要です。</p>
                </div>
                <button className={`${styles.actionBtn} ${styles.btnPurple}`}>確認</button>
              </div>
            )}
            
            <div className={styles.divider}></div>

            <div className={`${styles.alertBox} ${styles.alertBlue}`}>
              <div>
                <p className={`${styles.alertTitle} text-blue-700`}>システム正常</p>
                <p className={`${styles.alertDesc} text-blue-600`}>現在重大な障害は検知されていません。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component helper
const KPICard = ({ title, value, icon: Icon, iconStyle, isAlert }: any) => (
  <div className={`${styles.card} ${isAlert ? styles.kpiCardAlert : ''}`}>
    <div className={styles.cardHeader}>
      <div>
        <p className={styles.cardLabel}>{title}</p>
        <h3 className={styles.cardValue}>{value}</h3>
      </div>
      <div className={`${styles.iconWrapper} ${iconStyle}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);