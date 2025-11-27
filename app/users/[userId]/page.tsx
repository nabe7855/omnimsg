"use client";

import { PublicProfileScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";
import { useParams } from "next/navigation"; // ★ここを追加

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // ★ params を props から取るのではなく、フックから取得するのが一番確実です
  const params = useParams();
  const userId = params?.userId as string;

  // 1. 認証ロード中は何もしない
  if (!loaded) return null;

  // 2. 未ログインならログインへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // 3. IDが取れていない場合（念のため）
  if (!userId) {
    return <div>ユーザーIDが無効です</div>;
  }

  return (
    <PublicProfileScreen
      currentUser={currentUser}
      targetUserId={userId} // ★フックから取ったIDを渡す
      navigate={navigate}
    />
  );
}
