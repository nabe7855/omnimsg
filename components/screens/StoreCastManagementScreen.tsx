"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";
import { createClient } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useState } from "react";

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

  // -----------------------------
  // 🔒 安全な navigate
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

    // 自分の store_id を持つキャストを取得
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("store_id", currentUser.id)
      .eq("role", UserRole.CAST);

    if (error) {
      console.error("Error fetching casts:", error);
      return;
    }

    if (data) {
      setMyCasts(data as Profile[]);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCasts();
  }, [fetchCasts]);

  // -----------------------------
  // 2. キャスト作成 (修正版)
  // -----------------------------
  const handleCreate = async () => {
    if (!newName || !newEmail || !newPass) {
      alert("すべての項目を入力してください");
      return;
    }
    if (!currentUser) return;

    setIsProcessing(true);

    try {
      // ★重要修正: セッションを保存しない設定で一時クライアントを作成
      // これにより、メインの店舗ログイン状態が維持されます
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false, // ローカルストレージを使わない
            autoRefreshToken: false, // トークン更新もしない
            detectSessionInUrl: false, // URLからも読み取らない
          },
        }
      );

      // ① 一時クライアントで新規登録
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

      // ② プロフィールを作成
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

      // ③ 作成完了後、リストを再読み込みして画面に反映
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
  // 3. キャスト削除
  // -----------------------------
  const handleDelete = async (castId: string) => {
    if (
      !window.confirm(
        "このキャストをリストから削除しますか？\n（注: データベースのProfileのみ削除されます）"
      )
    ) {
      return;
    }

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
    return <div className="cast-mgmt-loading-message">読み込み中...</div>;
  }

  return (
    <div className="cast-mgmt-screen">
      <div className="cast-mgmt-header">
        <h2 className="heading-xl cast-mgmt-title">キャスト管理</h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary cast-mgmt-add-button"
        >
          新規追加
        </button>
      </div>

      <div className="cast-mgmt-list">
        {myCasts.map((c) => (
          <div
            key={c.id}
            className="cast-mgmt-card"
            onClick={() => safeNavigate(`/profile`)}
          >
            <div className="cast-mgmt-card-main">
              <img
                src={c.avatar_url || "/placeholder-avatar.png"}
                className="cast-mgmt-avatar"
                alt={c.name}
                onError={(e) =>
                  ((e.target as HTMLImageElement).src =
                    "/placeholder-avatar.png")
                }
              />
              <div>
                <div className="cast-mgmt-name">{c.name}</div>
                <div className="cast-mgmt-id">ID: {c.display_id}</div>
              </div>
            </div>

            <div className="cast-mgmt-card-right">
              <div className="cast-mgmt-status-label">有効</div>

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
        ))}

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
            <p className="cast-mgmt-modal-desc">
              キャスト用のログインIDとパスワードを発行します。
            </p>

            <div className="cast-mgmt-modal-fields">
              <div className="input-group">
                <label className="input-label">名前</label>
                <input
                  className="input-field"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例: さくら"
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  メールアドレス (ログインID)
                </label>
                <input
                  className="input-field"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="cast@example.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">パスワード</label>
                <input
                  className="input-field"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="8文字以上"
                />
              </div>
            </div>

            <div className="cast-mgmt-modal-actions">
              <button
                type="button"
                onClick={closeModal}
                disabled={isProcessing}
                className="btn-secondary cast-mgmt-modal-button"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isProcessing}
                className="btn-primary cast-mgmt-modal-button"
              >
                {isProcessing ? "作成中..." : "作成"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
