"use client";

import { supabase } from "@/lib/supabaseClient";
import { ScreenProps } from "@/lib/types/screen";
import React, { useEffect, useState } from "react";

export const ScheduledBroadcastsScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 一覧取得
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("*")
        .eq("sender_id", currentUser.id)
        .eq("status", "pending") // 未送信のみ
        .order("scheduled_at", { ascending: true });

      if (error) console.error(error);
      else setSchedules(data || []);
      setIsLoading(false);
    };
    load();
  }, [currentUser]);

  // 予約キャンセル（削除）
  const handleCancel = async (id: string) => {
    if (!confirm("この送信予約を取り消しますか？")) return;
    
    const { error } = await supabase
      .from("broadcast_messages")
      .delete()
      .eq("id", id);

    if (error) {
      alert("キャンセルに失敗しました");
    } else {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      alert("予約を取り消しました");
    }
  };

  if (!currentUser) return null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f8f9fa" }}>
      <div style={{ padding: "15px", background: "white", borderBottom: "1px solid #eee", display: "flex", alignItems: "center" }}>
        <button onClick={() => navigate("/broadcast")} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", marginRight: "10px" }}>←</button>
        <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "bold" }}>送信予約一覧</h2>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
        {isLoading ? (
          <div>読み込み中...</div>
        ) : schedules.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999", marginTop: "50px" }}>
            現在、送信待ちの予約はありません。
          </div>
        ) : (
          schedules.map((item) => (
            <div key={item.id} style={{ background: "white", padding: "15px", borderRadius: "8px", marginBottom: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: "#28a745" }}>
                  📅 {new Date(item.scheduled_at).toLocaleString()}
                </span>
                <button onClick={() => handleCancel(item.id)} style={{ fontSize: "12px", padding: "4px 8px", border: "1px solid #ff4444", color: "#ff4444", background: "white", borderRadius: "4px", cursor: "pointer" }}>
                  取り消し
                </button>
              </div>

              <div style={{ fontSize: "14px", color: "#333", whiteSpace: "pre-wrap", marginBottom: "10px" }}>
                {item.content || "(画像のみ)"}
              </div>

              {item.image_url && (
                <img src={item.image_url} alt="添付画像" style={{ maxWidth: "100px", borderRadius: "4px", border: "1px solid #eee" }} />
              )}
              
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
                送信対象: {item.target_count ?? "不明"} 人
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};