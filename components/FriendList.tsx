"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import { useEffect, useState } from "react";

export const FriendList = () => {
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);

    // 現在のユーザー取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }

    // ======================================
    // ★ 自分 → accepted の target_id のプロフィールを JOIN 取得
    // ======================================
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
      .eq("status", "accepted");

    if (error) {
      console.error("FriendList load error:", error);
      setLoading(false);
      return;
    }

    // target_profile のみ抽出（null除外）
    const mapped: Profile[] = data
      .map((row: any) => row.target_profile)
      .filter(Boolean);

    setList(mapped);
    setLoading(false);
  };

  if (loading) return <p>読み込み中...</p>;
  if (list.length === 0) return <p>友だちはいません</p>;

  return (
    <div>
      {list.map((u) => (
        <div key={u.id} className="user-card flex items-center gap-3 p-2">
          <img
            src={u.avatar_url || "/placeholder-avatar.png"}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-bold">{u.name}</div>
            <div className="text-sm text-gray-500">ID: {u.display_id}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
