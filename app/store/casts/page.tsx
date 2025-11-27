"use client";

import { StoreCastManagementScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ★ useAuth が読み込み完了するまで描画しない
  if (!loaded) return null;

  // ★ 未ログインならログインページへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <StoreCastManagementScreen
      currentUser={currentUser} // ← Profile 型が確定
      navigate={navigate}
    />
  );
}
