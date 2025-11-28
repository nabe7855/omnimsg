"use client";

import { HomeScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";
import { useEffect } from "react";

export default function HomePage() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // 🚨 Hooks の後で判定するようにする
  useEffect(() => {
    if (loaded && !currentUser) {
      navigate("/login");
    }
  }, [loaded, currentUser, navigate]);

  // ローディング中
  if (!loaded) return null;

  // 未ログイン → リダイレクト待ち
  if (!currentUser) return null;

  // ログイン済 → ホーム画面
  return <HomeScreen currentUser={currentUser} navigate={navigate} />;
}
