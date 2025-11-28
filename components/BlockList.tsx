"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import { useEffect, useState } from "react";

export const BlockList = () => {
  const [list, setList] = useState<Profile[]>([]);
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

    // ======================================
    // ★ 自分がブロックした → user_id = currentUser.id
    // ★ ブロック相手のプロフィール → target_id の JOIN
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
      .eq("status", "blocked");

    if (error) {
      console.error("BlockList load error:", error);
      setLoading(false);
      return;
    }

    // JOIN の結果だけ抽出（null除外）
    const mapped: Profile[] = data
      .map((row: any) => row.target_profile)
      .filter(Boolean);

    setList(mapped);
    setLoading(false);
  };

  if (loading) return <p>読み込み中...</p>;

  if (list.length === 0)
    return <p className="text-gray-500">ブロックしているユーザーはいません</p>;

  return (
    <div>
      {list.map((u) => (
        <div key={u.id} className="user-card">
          <img
            src={u.avatar_url || "/placeholder-avatar.png"}
            className="w-12 h-12 rounded-full mr-3"
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
