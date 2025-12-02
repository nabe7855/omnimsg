// components/admin/AdminSidebar.tsx
"use client";

import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin-sidebar.module.css";
import {
  AlertTriangle,
  FileText,
  LayoutDashboard,
  LogOut,
  Scale,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // メニュー項目の定義
  const menuItems = [
    {
      id: "dashboard",
      label: "ダッシュボード",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "users",
      label: "ユーザー管理",
      path: "/admin/usermanagement",
      icon: Users,
    },
    {
      id: "reports",
      label: "通報管理",
      path: "/admin/reportmanagement",
      icon: AlertTriangle,
    },
    {
      id: "inquiries",
      label: "法務・問合せ",
      path: "/admin/inquirymanagement",
      icon: Scale,
    },
    {
      id: "logaudit",
      label: "監査ログ",
      path: "/admin/logaudit",
      icon: FileText,
    },
  ];

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      {/* サイドバー本体 */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        {/* ヘッダー */}
        <div className={styles.header}>
          <div className={styles.logoArea}>
            <ShieldAlert className={styles.logoIcon} />
            <div>
              <h1 className={styles.appTitle}>Legal Safety</h1>
              <p className={styles.appSubtitle}>Control Center</p>
            </div>
          </div>
          {/* モバイル用閉じるボタン */}
          <button onClick={onClose} className={styles.closeBtn}>
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            // 現在のパスがメニューのパスと一致するか判定
            const isActive =
              pathname === item.path || pathname.startsWith(item.path + "/");

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onClose} // モバイルでは遷移時に閉じる
                className={`${styles.navItem} ${
                  isActive ? styles.navItemActive : ""
                }`}
              >
                <Icon className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* フッター（ユーザー情報 & ログアウト） */}
        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>AD</div>
              <div className={styles.userDetails}>
                <p className={styles.userName}>Admin User</p>
                <p className={styles.userStatus}>● Online</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="ログアウト"
            >
              <LogOut className={styles.logoutIcon} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
