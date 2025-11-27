"use client";

import { HomeScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ★ ローディング中は何も描画しない
  if (!loaded) return null;

  // ★ 未ログインならログインページへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ★ currentUser は Profile のみ（null ではない）
  return <HomeScreen currentUser={currentUser} navigate={navigate} />;
}
