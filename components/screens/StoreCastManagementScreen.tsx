"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import { createClient } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useState } from "react";

// ▼ 追加: 展開時のデータ型
type CastRelations = {
  friends: Profile[];
  blockedFriends: Profile[];
};

export const StoreCastManagementScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [myCasts, setMyCasts] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ▼ 追加: 展開機能用のステート
  const [expandedCastId, setExpandedCastId] = useState<string | null>(null);
  const [castRelations, setCastRelations] = useState<CastRelations | null>(
    null
  );
  const [loadingRelations, setLoadingRelations] = useState(false);

  // -----------------------------
  // 🔒 安全 navigate
  // -----------------------------
  const safeNavigate = useCallback(
    (path: string) => {
      setTimeout(() => navigate(path), 0);
    },
    [navigate]
  );

  // -----------------------------
  // 1. キャスト読み込み
  // -----------------------------
  const fetchCasts = useCallback(async () => {
    if (!currentUser || currentUser.role !== UserRole.STORE) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("store_id", currentUser.id)
      .eq("role", UserRole.CAST);

    if (error) {
      console.error("Error fetching casts:", error);
      return;
    }

    if (data) setMyCasts(data as Profile[]);
  }, [currentUser]);

  useEffect(() => {
    fetchCasts();
  }, [fetchCasts]);

  // -----------------------------
  // 2. キャストの関連ユーザー（友達/ブロック）を取得
  // -----------------------------
  const toggleExpand = async (castId: string) => {
    // 既に開いているものを閉じるとき
    if (expandedCastId === castId) {
      setExpandedCastId(null);
      setCastRelations(null);
      return;
    }

    // 新しく開くとき
    setExpandedCastId(castId);
    setLoadingRelations(true);
    setCastRelations(null);

    try {
      // A. 友達リストを取得 (friendships)
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${castId},addressee_id.eq.${castId}`);

      if (friendsError) throw friendsError;

      // 相手のIDを抽出
      const friendIds = (friendsData || []).map((f) =>
        f.requester_id === castId ? f.addressee_id : f.requester_id
      );

      if (friendIds.length === 0) {
        setCastRelations({ friends: [], blockedFriends: [] });
        setLoadingRelations(false);
        return;
      }

      // B. キャストがブロックしているリストを取得 (connections)
      const { data: blockData, error: blockError } = await supabase
        .from("connections")
        .select("target_id")
        .eq("user_id", castId)
        .eq("status", "blocked");

      if (blockError) throw blockError;

      const blockedIds = new Set(blockData?.map((b) => b.target_id) || []);

      // C. プロフィール情報を一括取得
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds);

      if (profilesError) throw profilesError;

      // D. 「友達」と「ブロック中の友達」に振り分け
      const friends: Profile[] = [];
      const blockedFriends: Profile[] = [];

      (profiles || []).forEach((p) => {
        if (blockedIds.has(p.id)) {
          blockedFriends.push(p);
        } else {
          friends.push(p);
        }
      });

      setCastRelations({ friends, blockedFriends });
    } catch (e) {
      console.error("関係取得エラー:", e);
      alert("データの取得に失敗しました");
    } finally {
      setLoadingRelations(false);
    }
  };

  // -----------------------------
  // 3. キャスト作成
  // -----------------------------
  const handleCreate = async () => {
    if (!newName || !newEmail || !newPass) {
      alert("すべての項目を入力してください");
      return;
    }
    if (!currentUser) return;

    setIsProcessing(true);

    try {
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: authData, error: authError } =
        await tempSupabase.auth.signUp({
          email: newEmail,
          password: newPass,
          options: {
            data: {
              name: newName,
              role: UserRole.CAST,
            },
          },
        });

      if (authError) throw authError;
      const newUser = authData.user;
      if (!newUser) throw new Error("ユーザー作成に失敗しました");

      const displayId = newUser.id.slice(0, 8);

      const { error: profileError } = await tempSupabase
        .from("profiles")
        .insert([
          {
            id: newUser.id,
            email: newEmail,
            role: UserRole.CAST,
            name: newName,
            display_id: displayId,
            store_id: currentUser.id,
            avatar_url: "",
            bio: "",
          },
        ]);

      if (profileError) throw profileError;

      await fetchCasts();
      closeModal();
      alert(`キャスト「${newName}」を作成しました！`);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "作成に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // -----------------------------
  // 4. キャスト削除
  // -----------------------------
  const handleDelete = async (castId: string) => {
    if (!window.confirm("このキャストを削除してもよいですか？")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", castId);

      if (error) throw error;

      setMyCasts((prev) => prev.filter((c) => c.id !== castId));
    } catch (e: any) {
      alert("削除に失敗しました: " + e.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPass("");
  };

  if (!currentUser) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="cast-mgmt-screen">
      <div className="cast-mgmt-header">
        <h2 className="heading-xl cast-mgmt-title">キャスト管理</h2>

        <button
          type="button"
          onClick={() => safeNavigate("/group/create")}
          className="btn-secondary"
        >
          ＋ グループ作成
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary cast-mgmt-add-button"
        >
          ＋ キャスト追加
        </button>
      </div>

      {/* キャスト一覧 */}
      <div className="cast-mgmt-list">
        {myCasts.map((c) => {
          const isExpanded = expandedCastId === c.id;

          return (
            <div
              key={c.id}
              className="cast-mgmt-card-wrapper"
              style={{
                marginBottom: "10px",
                border: "1px solid #eee",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              {/* カード本体 */}
              <div
                className="cast-mgmt-card"
                onClick={() => safeNavigate(`/users/${c.id}`)}
                style={{ borderBottom: isExpanded ? "1px solid #eee" : "none" }}
              >
                <div className="cast-mgmt-card-main">
                  <img
                    src={c.avatar_url || "/placeholder-avatar.png"}
                    className="cast-mgmt-avatar"
                    alt={c.name}
                  />
                  <div>
                    <div className="cast-mgmt-name">{c.name}</div>
                    <div className="cast-mgmt-id">ID: {c.display_id}</div>
                  </div>
                </div>
                <div className="cast-mgmt-card-right">
                  <div className="cast-mgmt-status-label">有効</div>

                  {/* ▼ 追加: 展開ボタン */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // 親の遷移イベントを止める
                      toggleExpand(c.id);
                    }}
                    style={{
                      background: "none",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      marginRight: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="cast-mgmt-delete-button"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* ▼ 展開エリア（友達リスト & ブロックリスト） */}
              {isExpanded && (
                <div
                  className="cast-relations-area"
                  style={{ padding: "10px", backgroundColor: "#f9f9f9" }}
                >
                  {loadingRelations ? (
                    <p style={{ fontSize: "12px", color: "#666" }}>
                      読み込み中...
                    </p>
                  ) : !castRelations ? (
                    <p>データがありません</p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "15px",
                      }}
                    >
                      {/* 1. 友達リスト */}
                      <div>
                        <h4
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            marginBottom: "5px",
                            color: "#6b46c1",
                          }}
                        >
                          友達リスト ({castRelations.friends.length})
                        </h4>
                        {castRelations.friends.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#999" }}>
                            なし
                          </p>
                        ) : (
                          <ul
                            style={{ listStyle: "none", padding: 0, margin: 0 }}
                          >
                            {castRelations.friends.map((friend) => (
                              <li
                                key={friend.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "4px 0",
                                  borderBottom: "1px dashed #eee",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  safeNavigate(`/users/${friend.id}`)
                                }
                              >
                                <img
                                  src={
                                    friend.avatar_url ||
                                    "/placeholder-avatar.png"
                                  }
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    marginRight: "8px",
                                    objectFit: "cover",
                                  }}
                                />
                                <span style={{ fontSize: "12px" }}>
                                  {friend.name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* 2. ブロック中の友達 */}
                      <div>
                        <h4
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            marginBottom: "5px",
                            color: "#e53e3e",
                          }}
                        >
                          ブロック中の友達 (
                          {castRelations.blockedFriends.length})
                        </h4>
                        {castRelations.blockedFriends.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#999" }}>
                            なし
                          </p>
                        ) : (
                          <ul
                            style={{ listStyle: "none", padding: 0, margin: 0 }}
                          >
                            {castRelations.blockedFriends.map((blocked) => (
                              <li
                                key={blocked.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "4px 0",
                                  borderBottom: "1px dashed #eee",
                                  cursor: "pointer",
                                  opacity: 0.6, // ブロック中は少し薄く表示
                                }}
                                onClick={() =>
                                  safeNavigate(`/users/${blocked.id}`)
                                }
                              >
                                <img
                                  src={
                                    blocked.avatar_url ||
                                    "/placeholder-avatar.png"
                                  }
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    marginRight: "8px",
                                    objectFit: "cover",
                                  }}
                                />
                                <span style={{ fontSize: "12px" }}>
                                  {blocked.name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {myCasts.length === 0 && (
          <div className="cast-mgmt-empty-message">
            キャストはまだ登録されていません。
          </div>
        )}
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="cast-mgmt-modal-backdrop">
          <div className="cast-mgmt-modal">
            <h3 className="cast-mgmt-modal-title">キャスト新規登録</h3>

            <div className="input-group">
              <label>名前</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>メールアドレス</label>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>パスワード</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>

            <div className="cast-mgmt-modal-actions">
              <button onClick={closeModal} className="btn-secondary">
                キャンセル
              </button>
              <button onClick={handleCreate} className="btn-primary">
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
