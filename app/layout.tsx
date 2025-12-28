"use client";

import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import "@/styles/layout.css";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import "./globals.css";

// 歯車アイコン（プロフィール設定用）
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
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
  const { currentUser, loaded, logout } = useAuth();
  const [userType, setUserType] = useState<"creator" | "user">("user");

  // --- 1. デバッグ・プッシュ通知 ---
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  usePushSubscription(currentUser?.id);

  // --- 2. URLハッシュによる表示モード同期 ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes("creator")) setUserType("creator");
      if (hash.includes("user")) setUserType("user");
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const updateType = (type: "creator" | "user") => {
    setUserType(type);
    window.location.hash = `#/${type}`;
  };

  // --- 3. 強制リダイレクト処理 (キャストの同意ガード) ---
  useEffect(() => {
    if (!loaded || !currentUser) return;

    if (currentUser.role?.toLowerCase() === "cast") {
      const hasAgreed =
        !!currentUser.agreed_to_terms_at &&
        !!currentUser.agreed_to_external_transmission_at;
      if (!hasAgreed) {
        if (pathname !== "/cast/agreements") router.replace("/cast/agreements");
      } else {
        if (pathname === "/cast/agreements") router.replace("/home");
      }
    }
  }, [currentUser, loaded, pathname, router]);

  // --- 4. 特殊なパスの処理 (管理画面/同意画面) ---
  if (pathname?.startsWith("/admin") || pathname === "/cast/agreements") {
    return (
      <html lang="ja">
        <body>{children}</body>
      </html>
    );
  }

  // --- 5. ローディング表示 ---
  if (!loaded) {
    return (
      <html lang="ja">
        <body className="flex items-center justify-center h-screen bg-white">
          <p className="animate-pulse text-gray-400 font-medium">
            読み込み中...
          </p>
        </body>
      </html>
    );
  }

  // --- 6. UI制御データ生成 ---
  const getPageTitle = () => {
    if (pathname === "/home") return "ホーム";
    if (pathname === "/talks") return "トーク一覧";
    if (pathname.startsWith("/talk/")) return "チャット";
    if (pathname === "/profile") return "プロフィール";
    if (pathname === "/store/casts") return "キャスト管理";
    if (pathname === "/store/menu") return "メニュー設定";
    if (pathname === "/broadcast") return "一斉送信";
    return "";
  };

  const getFooterItems = () => {
    if (!currentUser) return [];
    const role = currentUser.role?.toLowerCase();

    if (role === "cast") {
      const hasAgreed =
        !!currentUser.agreed_to_terms_at &&
        !!currentUser.agreed_to_external_transmission_at;
      if (!hasAgreed) return [];
    }

    const baseItems = [
      { id: "/home", label: "ホーム", icon: "🏠" },
      { id: "/talks", label: "トーク", icon: "💬" },
    ];

    if (role === "store") {
      return [
        ...baseItems,
        { id: "/store/casts", label: "キャスト", icon: "👥" },
        { id: "/store/menu", label: "メニュー", icon: "📋" },
        { id: "/profile", label: "マイページ", icon: "👤" },
      ];
    }

    return [...baseItems, { id: "/profile", label: "マイページ", icon: "👤" }];
  };

  const isCreator = userType === "creator";
  const footerItems = getFooterItems();
  const shouldShowFooter =
    currentUser && footerItems.length > 0 && pathname !== "/login";

  return (
    <html lang="ja">
      <body
        className={`min-h-screen transition-colors duration-700 ${
          isCreator
            ? "gradient-creator text-white"
            : "gradient-user text-gray-900"
        }`}
      >
        <div className="app-container flex flex-col min-h-screen">
          {/* --- 統合ヘッダー --- */}
          <Header
            userType={userType}
            setUserType={updateType}
            isLoggedIn={!!currentUser}
            onLogout={logout}
          />

          {/* アプリケーション固有のサブヘッダー (戻るボタン/タイトル) ※必要に応じて */}
          {currentUser && pathname !== "/" && pathname !== "/home" && (
            <div className="flex items-center px-4 py-2 border-b border-current opacity-20">
              <button
                onClick={() => router.back()}
                className="text-sm font-bold mr-4"
              >
                ← 戻る
              </button>
              <h1 className="text-sm font-black uppercase tracking-widest">
                {getPageTitle()}
              </h1>

              <div className="ml-auto">
                {pathname === "/profile" && (
                  <button
                    onClick={() =>
                      document
                        .getElementById("profile-settings")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    <SettingsIcon />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --- メインコンテンツ --- */}
          <main className="flex-1 app-main content-area">{children}</main>

          {/* --- 統合ボトムナビゲーション --- */}
          {shouldShowFooter && (
            <nav
              className={`bottom-nav sticky bottom-0 flex justify-around items-center h-16 border-t backdrop-blur-md transition-all ${
                isCreator
                  ? "bg-violet-950/80 border-white/10"
                  : "bg-white/80 border-gray-100"
              }`}
            >
              {footerItems.map((item) => (
                <button
                  key={item.id}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    pathname === item.id || pathname.startsWith(item.id + "/")
                      ? isCreator
                        ? "text-amber-500 scale-110"
                        : "text-pink-500 scale-110"
                      : "opacity-40"
                  }`}
                  onClick={() => router.push(item.id)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </body>
    </html>
  );
}
