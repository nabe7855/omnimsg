"use client";

import { StoreMenuSettingsScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ★ 初期ロード完了前は何も描画しない
  if (!loaded) return null;

  // ★ 未ログインなら login へ飛ばす
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ★ currentUser はここで Profile 型なので安全
  return (
    <StoreMenuSettingsScreen currentUser={currentUser} navigate={navigate} />
  );
}
