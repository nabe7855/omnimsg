"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import { useEffect, useState } from "react";

// 表示用に型を定義（connectionsテーブルのIDと、相手のプロフィール）
type BlockedUser = {
  connection_id: string; // ブロック解除時に使うID
  profile: Profile; // 表示用のプロフィール情報
};

export const BlockList = () => {
  const [list, setList] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocked();
  }, []);

  const loadBlocked = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // connections テーブルから status = 'blocked' のデータを取得
    // target_id に紐づく profile 情報を JOIN して取得
    const { data, error } = await supabase
      .from("connections")
      .select(
        `
        id,
        status,
        target_profile:target_id (
          id,
          name,
          display_id,
          role,
          avatar_url
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "blocked");

    if (error) {
      console.error("BlockList load error:", error);
      setLoading(false);
      return;
    }

    // データ整形（相手のプロフィールが存在するものだけ抽出）
    const mapped: BlockedUser[] = data
      .map((row: any) => ({
        connection_id: row.id,
        profile: row.target_profile,
      }))
      .filter((item) => item.profile !== null); // 相手が退会済みの場合などを考慮

    setList(mapped);
    setLoading(false);
  };

  // ★ ブロック解除機能
  const handleUnblock = async (connectionId: string, userName: string) => {
    if (!confirm(`${userName}さんのブロックを解除しますか？`)) return;

    // connections テーブルから該当レコードを物理削除
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      console.error("Unblock error:", error);
      alert("解除に失敗しました");
    } else {
      // 成功したら画面のリストからも削除
      setList((prev) =>
        prev.filter((item) => item.connection_id !== connectionId)
      );
      alert("ブロックを解除しました");
    }
  };

  if (loading) return <div className="p-4 text-center">読み込み中...</div>;

  if (list.length === 0)
    return (
      <div className="p-4 text-center text-gray-500">
        ブロックしているユーザーはいません
      </div>
    );

  return (
    <div className="max-w-md mx-auto">
      {list.map((item) => (
        <div
          key={item.connection_id}
          className="flex items-center justify-between p-3 border-b border-gray-100 bg-white"
        >
          {/* 左側：アイコンと名前 */}
          <div className="flex items-center">
            <img
              src={item.profile.avatar_url || "/placeholder-avatar.png"}
              alt={item.profile.name}
              className="w-12 h-12 rounded-full mr-3 object-cover border"
            />
            <div>
              <div className="font-bold text-sm">{item.profile.name}</div>
              <div className="text-xs text-gray-500">
                ID: {item.profile.display_id}
              </div>
            </div>
          </div>

          {/* 右側：解除ボタン */}
          <button
            onClick={() => handleUnblock(item.connection_id, item.profile.name)}
            className="text-xs border border-red-500 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-50 transition"
          >
            解除
          </button>
        </div>
      ))}
    </div>
  );
};
