"use client";

import { BroadcastScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ⭐ 読み込み中は loaded === false
  if (!loaded) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>読み込み中...</div>
    );
  }

  // ⭐ 未ログイン時はログイン画面へ（任意）
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ⭐ ログイン済 → 一斉送信画面へ
  return <BroadcastScreen currentUser={currentUser} navigate={navigate} />;
}
