"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/mockSupabase";
import { Profile, UserRole } from "@/lib/types";
import { ScreenProps } from "@/lib/types/screen";

export const StoreCastManagementScreen: React.FC<ScreenProps> = ({
  currentUser,
  navigate,
}) => {
  const [myCasts, setMyCasts] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");

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
  // キャスト読み込み
  // -----------------------------
  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.STORE) return;

    const load = async () => {
      const result = await db.getMyCasts(currentUser.id);
      setMyCasts(result);
    };

    load();
  }, [currentUser]);

  // -----------------------------
  // キャスト作成
  // -----------------------------
  const handleCreate = async () => {
    if (!newName || !newEmail || !newPass) {
      alert("すべての項目を入力してください");
      return;
    }
    if (!currentUser) return;

    try {
      const newCast = await db.createCast(
        currentUser.id,
        newName,
        newEmail,
        newPass
      );
      setMyCasts((prev) => [...prev, newCast]);
      closeModal();
      alert("キャストアカウントを作成しました。");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // -----------------------------
  // キャスト削除
  // -----------------------------
  const handleDelete = async (castId: string) => {
    if (
      window.confirm(
        "このアカウントを削除してもよろしいですか？\nこの操作は取り消せません。"
      )
    ) {
      await db.deleteProfile(castId);
      setMyCasts((prev) => prev.filter((c) => c.id !== castId));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPass("");
  };

  // -----------------------------
  // currentUser が null の間は表示を待つ
  // -----------------------------
  if (!currentUser) {
    return (
      <div className="cast-mgmt-loading-message">
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
            onClick={() => safeNavigate(`/users/${c.id}`)}
          >
            <div className="cast-mgmt-card-main">
              <img
                src={c.avatar_url}
                className="cast-mgmt-avatar"
                alt={c.name}
              />
              <div>
                <div className="cast-mgmt-name">{c.name}</div>
                <div className="cast-mgmt-id">ID: {c.display_id}</div>
              </div>
            </div>

            <div className="cast-mgmt-card-right">
              <div className="cast-mgmt-status-label">
                有効
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(c.id);
                }}
                className="cast-mgmt-delete-button"
              >
                <svg
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="cast-mgmt-delete-icon"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21
                    c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673
                    a2.25 2.25 0 0 1-2.244 2.077H8.084
                    a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79
                    m14.456 0a48.108 48.108 0 0 0-3.478-.397
                    m-12 .562c.34-.059.68-.114 1.022-.165m0 0
                    a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916
                    c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0
                    c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0
                    a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
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
            <h3 className="cast-mgmt-modal-title">
              キャスト新規登録
            </h3>

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
                  placeholder="********"
                />
              </div>
            </div>

            <div className="cast-mgmt-modal-actions">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary cast-mgmt-modal-button"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="btn-primary cast-mgmt-modal-button"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
