"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import React, { useCallback, useEffect, useState } from "react";

// ▼ 展開時のデータ型
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

  // ▼ 展開機能用のステート
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

  // ▼▼▼ 追加: 未ログインならログイン画面へリダイレクト ▼▼▼
  useEffect(() => {
    // currentUserがnull（未ログイン）の場合、自動でログインへ戻す
    // ※親コンポーネントでロード完了(loaded)を確認してからレンダリングされている前提
    if (!currentUser) {
      safeNavigate("/login");
    }
  }, [currentUser, safeNavigate]);

  // -----------------------------
  // 1. キャスト読み込み
  // -----------------------------
  const fetchCasts = useCallback(async () => {
    if (!currentUser?.id) return;

    // ▼▼▼ 修正: Role判定を安全にする（小文字化して比較） ▼▼▼
    const currentRole = currentUser.role?.toLowerCase();
    if (currentRole !== "store") return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("store_id", currentUser.id)
      .eq("role", "cast"); // DBの値に合わせて小文字で検索

    if (error) {
      console.error("Error fetching casts:", error);
      return;
    }

    if (data) setMyCasts(data as Profile[]);
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    fetchCasts();
  }, [fetchCasts]);

  // -----------------------------
  // 2. キャストの関連ユーザー（友達/ブロック）を取得
  // -----------------------------
  const toggleExpand = async (castId: string) => {
    if (expandedCastId === castId) {
      setExpandedCastId(null);
      setCastRelations(null);
      return;
    }

    setExpandedCastId(castId);
    setLoadingRelations(true);
    setCastRelations(null);

    try {
      // A. 友達リストを取得
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${castId},addressee_id.eq.${castId}`);

      if (friendsError) throw friendsError;

      const friendIds = (friendsData || []).map((f) =>
        f.requester_id === castId ? f.addressee_id : f.requester_id
      );

      if (friendIds.length === 0) {
        setCastRelations({ friends: [], blockedFriends: [] });
        setLoadingRelations(false);
        return;
      }

      // B. ブロックリストを取得
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

      // D. 振り分け
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
  // 3. キャスト作成 (修正版: 安全なエラーハンドリング)
  // -----------------------------
  const handleCreate = async () => {
    // 1. バリデーション
    if (!newName || !newEmail || !newPass) {
      alert("すべての項目を入力してください");
      return;
    }

    setIsProcessing(true);

    try {
      // 2. API呼び出し
      const response = await fetch("/api/create-cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPass,
        }),
      });

      // 3. レスポンスの解析 (JSON以外が返ってくるケースを考慮)
      let result;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        // JSONじゃない場合（サーバークラッシュ時のHTMLなど）はテキストとして読み取る
        const text = await response.text();
        console.error("Non-JSON Response:", text);
        throw new Error(`サーバーエラーが発生しました (${response.status})`);
      }

      // 4. API側でエラー判定された場合
      if (!response.ok) {
        const message = result.details
          ? `${result.error}\n詳細: ${result.details}`
          : result.error || "作成に失敗しました";
        throw new Error(message);
      }

      // 5. 成功時の処理
      // fetchCastsが万が一コケても、後続の処理（モーダル閉じなど）は実行させる
      try {
        await fetchCasts();
      } catch (fetchError) {
        console.error(
          "リスト更新に失敗しましたが、作成は完了しています",
          fetchError
        );
      }

      closeModal();

      alert(
        `キャスト「${newName}」のアカウントを作成しました！\n\n設定したメールアドレスとパスワードですぐにログイン可能です。`
      );
    } catch (e: any) {
      console.error("Create Error:", e);
      // ここで必ずエラー理由を表示
      alert(e.message || "予期せぬエラーで作成に失敗しました");
    } finally {
      // 6. 確実に処理中フラグを下ろす
      setIsProcessing(false);
    }
  };

  // -----------------------------
  // 4. キャスト削除 (APIルート使用版)
  // -----------------------------
  const handleDelete = async (castId: string) => {
    if (
      !window.confirm(
        "このキャストを完全に削除してもよいですか？\n（ログインもできなくなります）"
      )
    )
      return;

    try {
      const response = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_id: castId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "削除に失敗しました");
      }

      setMyCasts((prev) => prev.filter((c) => c.id !== castId));
      alert("キャストアカウントを削除しました");
    } catch (e: any) {
      console.error(e);
      alert("削除に失敗しました: " + e.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPass("");
  };

  // ▼▼▼ 読み込み中の表示 ▼▼▼
  if (!currentUser) {
    return (
      <div
        className="loading"
        style={{ padding: "40px", textAlign: "center", color: "#666" }}
      >
        読み込み中...
      </div>
    );
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

                  {/* 展開ボタン */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
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

              {/* 展開エリア */}
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
                      {/* 友達リスト */}
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

                      {/* ブロック中の友達 */}
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
                                  opacity: 0.6,
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
              <button
                onClick={handleCreate}
                className="btn-primary"
                disabled={isProcessing}
              >
                {isProcessing ? "処理中..." : "作成"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
