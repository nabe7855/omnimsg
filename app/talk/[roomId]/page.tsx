"use client";

import { ChatDetailScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page({ params }: { params: { id: string } }) {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ★ 初期ロード中
  if (!loaded) return null;

  // ★ 未ログインならログインページへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ★ currentUser はここで確実に Profile 型
  return (
    <ChatDetailScreen
      currentUser={currentUser}
      roomId={params.id}
      navigate={navigate}
    />
  );
}
