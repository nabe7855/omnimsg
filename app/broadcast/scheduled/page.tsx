"use client";

// 前回の回答で作成したコンポーネントをインポート
// ※もし Screens.tsx にまとめている場合は "@/components/screens/Screens" からインポートしてください
import { ScheduledBroadcastsScreen } from "@/components/screens/Screens";
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

  // ⭐ 未ログイン時はログイン画面へ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ⭐ ログイン済 → 予約一覧画面へ
  return (
    <ScheduledBroadcastsScreen currentUser={currentUser} navigate={navigate} />
  );
}
