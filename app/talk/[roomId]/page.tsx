"use client";

import { ChatDetailScreen } from "@/components/screens/ChatDetailScreen"; // パスは適宜合わせてください
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";
import { useParams } from "next/navigation"; // ★重要

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();
  
  // ★ URLから roomId を安全に取得するためのフック
  const params = useParams();
  const roomId = params?.roomId as string;

  // 1. 認証ロード中は何もしない
  if (!loaded) return null;

  // 2. 未ログインならログインへ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // 3. IDチェック (念のため)
  if (!roomId) {
    return <div>チャットルームIDが無効です</div>;
  }

  return (
    <ChatDetailScreen
      currentUser={currentUser}
      roomId={roomId} // ★フックから取ったIDを渡す
      navigate={navigate}
    />
  );
}