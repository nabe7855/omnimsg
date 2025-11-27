"use client";

import { RoomListScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ★ ロード完了前は何も描画しない
  if (!loaded) return null;

  // ★ 未ログインならログイン画面へ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return <RoomListScreen currentUser={currentUser} navigate={navigate} />;
}
