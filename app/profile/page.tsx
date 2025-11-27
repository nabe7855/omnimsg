"use client";

import { ProfileScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, logout, loaded } = useAuth();

  // ★ 初期ロード中は描画しない
  if (!loaded) return null;

  // ★ 未ログインはログインページへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ★ useAuth の logout を使う（mockSupabase と連動）
  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProfileScreen
      currentUser={currentUser} // ← Profile 型が保証される
      onLogout={handleLogout}
      navigate={navigate}
    />
  );
}
