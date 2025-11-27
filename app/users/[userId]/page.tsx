"use client";

import { PublicProfileScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page({ params }: { params: { id: string } }) {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ★ ローディング中は何も描画しない
  if (!loaded) return null;

  // ★ 未ログインならログインページへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <PublicProfileScreen
      currentUser={currentUser}
      targetUserId={params.id}
      navigate={navigate}
    />
  );
}
