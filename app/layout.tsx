// app/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import "@/styles/layout.css";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";

// ▼ 歯車アイコン（ヘッダー用）
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "24px", height: "24px", color: "#333" }} // ヘッダーの文字色に合わせる
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.212 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loaded } = useAuth();

  usePushSubscription(currentUser?.id);

  // ★追加: 管理者ページ (/admin) の場合は、アプリ全体の共通レイアウトを適用せず
  // そのまま children を返す (admin/layout.tsx に任せる)
  if (pathname?.startsWith("/admin")) {
    return (
      <html lang="ja">
        <body>{children}</body>
      </html>
    );
  }

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

  // ★設定アイコンクリック時の動作
  const handleSettingsClick = () => {
    const settingSection = document.getElementById("profile-settings");
    if (settingSection) {
      settingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

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
                <>
                  {/* ★ プロフィール画面の場合: 歯車アイコンを表示 */}
                  {pathname === "/profile" ? (
                    <button
                      onClick={handleSettingsClick}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <SettingsIcon />
                    </button>
                  ) : (
                    /* ★ それ以外の場合: ユーザー名を表示 */
                    <button
                      className="logout-btn"
                      onClick={() => router.push("/profile")}
                    >
                      {currentUser.name}
                    </button>
                  )}
                </>
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
