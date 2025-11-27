"use client";

import { ProfileScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, logout, loaded } = useAuth();

  // 初期ロード中
  if (!loaded) return null;

  // 未ログインはログインへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ログアウト
  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProfileScreen
      currentUser={currentUser}
      onLogout={handleLogout}
      navigate={navigate}
    />
  );
}
