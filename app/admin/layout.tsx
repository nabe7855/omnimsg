"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, loaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 認証ガード
  useEffect(() => {
    // ログイン画面はスキップ
    if (pathname === "/admin/login") return;

    if (loaded) {
      // ★修正ポイント: 型の不一致を回避するため、強制的に文字列として 'admin' と比較します
      if (!currentUser || (currentUser.role as string) !== "admin") {
        router.replace("/admin/login");
      }
    }
  }, [loaded, currentUser, router, pathname]);

  // ログイン画面の場合は、中身だけ表示して終了
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // --- 以下、ログイン画面以外の処理 ---

  const getPageTitle = () => {
    if (pathname === "/admin/dashboard") return "ダッシュボード";
    if (pathname === "/admin/users") return "ユーザー管理";
    if (pathname === "/admin/reports") return "通報管理";
    if (pathname === "/admin/inquiries") return "法務・問合せ";
    if (pathname === "/admin/logs") return "監査ログ";
    return "管理画面";
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-slate-500">Loading admin panel...</div>
      </div>
    );
  }

  // ★修正ポイント: ここも同様に文字列として比較
  if (!currentUser || (currentUser.role as string) !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* サイドバー */}
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300">
        {/* モバイル用ヘッダー */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg text-slate-800">
              {getPageTitle()}
            </h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            AD
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
