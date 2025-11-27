// app/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth"; // ← あなたのプロジェクトの仕様に合わせた
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();

  // --- ページタイトルを Next.js 版に置き換え ---
  const getPageTitle = () => {
    if (pathname === "/login") return "店舗 ログイン";
    if (pathname === "/home") return "ホーム";
    if (pathname === "/talks") return "トーク一覧";
    if (pathname.startsWith("/talk/")) return "チャット";
    if (pathname === "/profile") return "プロフィール";
    if (pathname === "/store/casts") return "キャスト管理";
    if (pathname === "/store/menu") return "メニュー設定";
    if (pathname === "/broadcast") return "一斉送信";
    if (pathname === "/group/create") return "グループ作成";
    if (pathname.startsWith("/group/edit/")) return "グループ編集";
    return "";
  };

  return (
    <html lang="ja">
      <body>
        <div className="app-container">
          {/* --- Header --- */}
          <header className="app-header">
            {/* 戻るボタン（/login 以外で表示） */}
            {pathname !== "/login" && (
              <button className="back-btn" onClick={() => router.back()}>
                ← 戻る
              </button>
            )}

            <h1 className="page-title">{getPageTitle()}</h1>

            <div className="header-right">
              {currentUser && (
                <button
                  className="logout-btn"
                  onClick={() => router.push("/profile")}
                >
                  {currentUser.name}
                </button>
              )}
            </div>
          </header>

          {/* --- Main content --- */}
          <main className="app-main">{children}</main>

          {/* --- Footer --- */}
          {currentUser && (
            <footer className="app-footer">
              <nav className="footer-nav">
                <button onClick={() => router.push("/home")}>ホーム</button>
                <button onClick={() => router.push("/talks")}>トーク</button>

                {currentUser.role === "store" && (
                  <>
                    <button onClick={() => router.push("/store/casts")}>
                      キャスト
                    </button>
                    <button onClick={() => router.push("/store/menu")}>
                      メニュー
                    </button>
                  </>
                )}

                <button onClick={() => router.push("/profile")}>マイ</button>
              </nav>
            </footer>
          )}
        </div>
      </body>
    </html>
  );
}
