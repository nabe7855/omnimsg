"use client";

import { StoreMenuSettingsScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  // 1. Auth情報のロード待ち
  if (!loaded) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400 text-sm">
        読み込み中...
      </div>
    );
  }

  // 2. 未ログインならログイン画面へ
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  // ★ 3. 重要修正: ユーザー情報はあるが、role がまだ空の場合は待機する
  // useAuthはメタデータを先に返すため、DBからroleを取得して反映するまでの
  // わずかな時間に undefined になることがあります。ここでガードします。
  if (!currentUser.role) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400 text-sm">
        権限情報を確認中...
      </div>
    );
  }

  // 4. 情報が揃ったら画面を表示
  return (
    <StoreMenuSettingsScreen currentUser={currentUser} navigate={navigate} />
  );
}
