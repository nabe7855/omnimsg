"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/mockSupabase";
import { Profile } from "@/lib/types";
import { GroupManageProps } from "@/lib/types/screen";

export const GroupManageScreen: React.FC<GroupManageProps> = ({
  currentUser,
  navigate,
  roomId,
}) => {
  // ============================
  // 認証チェック
  // ============================
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null; // 未ログインは何も描画しない

  const [groupName, setGroupName] = useState("");
  const [casts, setCasts] = useState<Profile[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const isEdit = !!roomId;

  // ============================
  // 初期ロード
  // ============================
  useEffect(() => {
    const load = async () => {
      const data = await db.getConnectablePeople(currentUser.id);
      setCasts(data.casts);
      setCustomers(data.users);

      if (isEdit && roomId) {
        const room = await db.getRoomById(roomId);
        if (room) {
          setGroupName(room.group_name || "");

          // 自店舗は除外
          const members = new Set(
            room.member_ids.filter((id) => id !== currentUser.id)
          );
          setSelectedIds(members);
        }
      }

      setIsLoading(false);
    };

    load();
  }, [currentUser, roomId, isEdit]);

  // ============================
  // メンバー選択
  // ============================
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  // ============================
  // 保存
  // ============================
  const handleSave = async () => {
    if (!groupName.trim()) return alert("グループ名を入力してください");
    if (selectedIds.size === 0) return alert("メンバーを選択してください");

    // ストア自身は自動追加
    const members = [...selectedIds, currentUser.id];

    if (isEdit && roomId) {
      await db.updateGroup(roomId, groupName, members);
      navigate(`/talk/${roomId}`);
    } else {
      const newRoom = await db.createGroupRoom(
        currentUser.id,
        groupName,
        members
      );
      navigate(`/talk/${newRoom.id}`);
    }
  };

  // ============================
  // 削除
  // ============================
  const handleDelete = async () => {
    if (!roomId) return;
    if (!window.confirm("本当に削除しますか？")) return;

    await db.deleteRoom(roomId);
    navigate("/talks");
  };

  if (isLoading) {
    return <div className="group-loading">読み込み中...</div>;
  }

  return (
    <div className="group-manage-screen">
      {/* Header */}
      <div className="group-manage-header">
        <button
          onClick={() => navigate("/talks")}
          className="group-back-button"
          type="button"
        >
          <svg
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon-20"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          <span className="group-back-label">戻る</span>
        </button>

        <h2 className="group-title">
          {isEdit ? "グループ編集" : "グループ作成"}
        </h2>

        <button
          onClick={handleSave}
          className="group-save-button"
          type="button"
        >
          {isEdit ? "完了" : "作成"}
        </button>
      </div>

      {/* Body */}
      <div className="group-body">
        <div className="group-field">
          <label className="input-label">グループ名</label>
          <input
            className="input-field"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="例: 常連様グループ"
          />
        </div>

        {/* Casts */}
        {casts.length > 0 && (
          <div className="group-section group-section-casts">
            <h3 className="group-section-title">キャスト</h3>

            <div className="group-member-list">
              {casts.map((cast) => (
                <div
                  key={cast.id}
                  onClick={() => toggleSelection(cast.id)}
                  className={
                    "user-card group-member-card " +
                    (selectedIds.has(cast.id)
                      ? "group-member-card-selected"
                      : "")
                  }
                >
                  <div className="group-member-main">
                    <img
                      src={cast.avatar_url}
                      className="avatar group-member-avatar"
                    />
                    <div>
                      <div className="group-member-name">{cast.name}</div>
                      <div className="group-member-role group-member-role-cast">
                        キャスト
                      </div>
                    </div>
                  </div>

                  {selectedIds.has(cast.id) && (
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="group-check-icon"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customers */}
        <div className="group-section group-section-users">
          <h3 className="group-section-title">ユーザー</h3>

          {customers.length === 0 ? (
            <div className="group-empty-text">
              選択可能なユーザーがいません
            </div>
          ) : (
            <div className="group-member-list">
              {customers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleSelection(user.id)}
                  className={
                    "user-card group-member-card " +
                    (selectedIds.has(user.id)
                      ? "group-member-card-selected"
                      : "")
                  }
                >
                  <div className="group-member-main">
                    <img
                      src={user.avatar_url}
                      className="avatar group-member-avatar"
                    />
                    <div>
                      <div className="group-member-name">{user.name}</div>
                      <div className="group-member-role group-member-role-user">
                        お客様
                      </div>
                    </div>
                  </div>

                  {selectedIds.has(user.id) && (
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="group-check-icon"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        {isEdit && (
          <button
            onClick={handleDelete}
            className="group-delete-button"
            type="button"
          >
            グループを削除して退出
          </button>
        )}
      </div>
    </div>
  );
};
