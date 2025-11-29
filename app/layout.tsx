// app/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
// ★追加: プッシュ通知用のフックをインポート
import { usePushSubscription } from "@/hooks/usePushSubscription";
import "@/styles/layout.css";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loaded } = useAuth();

  // ★追加: ログインユーザーがいる場合、プッシュ通知の許可・登録処理を実行
  usePushSubscription(currentUser?.id);

  // auth ロード完了前は空のコンテナだけ出す
  if (!loaded) {
    return (
      <html lang="ja">
        <body>
          <div className="app-container" />
        </body>
      </html>
    );
  }

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

  const getFooterItems = () => {
    if (!currentUser) return [];

    const role = currentUser.role;

    if (role === "user") {
      return [
        { id: "/home", label: "ホーム", icon: "🏠" },
        { id: "/talks", label: "トーク", icon: "💬" },
        { id: "/profile", label: "マイページ", icon: "👤" },
      ];
    }

    if (role === "cast") {
      return [
        { id: "/home", label: "ホーム", icon: "🏠" },
        { id: "/talks", label: "トーク", icon: "💬" },
        { id: "/profile", label: "マイページ", icon: "👤" },
      ];
    }

    if (role === "store") {
      return [
        { id: "/home", label: "ホーム", icon: "🏠" },
        { id: "/store/casts", label: "キャスト", icon: "👥" },
        { id: "/talks", label: "トーク", icon: "💬" },
        { id: "/store/menu", label: "メニュー", icon: "📋" },
        { id: "/profile", label: "マイページ", icon: "👤" },
      ];
    }

    return [];
  };

  const footerItems = getFooterItems();

  const shouldShowFooter =
    currentUser && footerItems.length > 0 && pathname !== "/login";

  return (
    <html lang="ja">
      <body>
        <div className="app-container">
          {/* Header */}
          <header className="app-header">
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

          {/* Main */}
          <main className="app-main content-area">{children}</main>

          {/* Bottom Nav */}
          {shouldShowFooter && (
            <nav className="bottom-nav">
              {footerItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${
                    pathname === item.id || pathname.startsWith(item.id + "/")
                      ? "active"
                      : ""
                  }`}
                  onClick={() => router.push(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </body>
    </html>
  );
}
