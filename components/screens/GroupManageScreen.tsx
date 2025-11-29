"use client";

import { getConnectablePeople } from "@/lib/db/group";
import { createGroupRoom, getRoomById, updateGroupRoom } from "@/lib/db/rooms";
import "@/styles/group.css";

import { Profile } from "@/lib/types";
import { GroupManageProps } from "@/lib/types/screen";
import { safeAvatar } from "@/lib/utils/avatar";
import React, { useEffect, useState } from "react";

export const GroupManageScreen: React.FC<GroupManageProps> = ({
  currentUser,
  navigate,
  roomId,
}) => {
  const [groupName, setGroupName] = useState("");
  const [casts, setCasts] = useState<Profile[]>([]);
  const [usersByCast, setUsersByCast] = useState<Record<string, Profile[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openCastIds, setOpenCastIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const isEdit = !!roomId;

  // ----------------------------------------------------
  // 初期ロード
  // ----------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      const data = await getConnectablePeople(currentUser.id);
      setCasts(data.casts);
      setUsersByCast(data.usersByCast);

      if (isEdit && roomId) {
        const room = await getRoomById(roomId);

        if (room) {
          setGroupName(room.group_name || "");

          const filtered = (room.member_ids ?? []).filter(
            (id: string) => id !== currentUser.id
          );

          setSelectedIds(new Set(filtered));
        }
      }

      setIsLoading(false);
    };

    load();
  }, [currentUser, roomId, isEdit]);

  // ----------------------------------------------------
  // Guard
  // ----------------------------------------------------
  if (!currentUser) return <div className="group-loading">ログイン中...</div>;
  if (isLoading) return <div className="group-loading">読み込み中...</div>;

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleCastOpen = (id: string) => {
    const next = new Set(openCastIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setOpenCastIds(next);
  };

  // ----------------------------------------------------
  // 保存
  // ----------------------------------------------------
  const handleSave = async () => {
    if (!groupName.trim()) return alert("グループ名を入力してください");

    const members = [...selectedIds, currentUser.id];

    if (isEdit && roomId) {
      await updateGroupRoom(roomId, groupName, members);
      navigate(`/talk/${roomId}`);
    } else {
      const newRoom = await createGroupRoom(currentUser.id, groupName, members);
      navigate(`/talk/${newRoom.id}`);
    }
  };

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
  return (
    <div className="group-manage-screen">
      {/* Header */}
      <div className="group-manage-header">
        <button
          onClick={() => navigate("/talks")}
          className="group-back-button"
        >
          ← 戻る
        </button>

        <h2 className="group-title">
          {isEdit ? "グループ編集" : "グループ作成"}
        </h2>

        <button className="group-save-button" onClick={handleSave}>
          {isEdit ? "完了" : "作成"}
        </button>
      </div>

      {/* Input */}
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
      <div className="group-section">
        <h3 className="group-section-title">キャスト & ユーザー</h3>

        {casts.map((cast) => {
          const castUsers = usersByCast[cast.id] || [];
          const isOpen = openCastIds.has(cast.id);
          const castSelected = selectedIds.has(cast.id);

          return (
            <div key={cast.id} className="group-cast-wrapper">
              {/* 上段：キャストカード & ボタン（完全分離） */}
              <div className="group-cast-row">
                {/* --- 左：キャストカード本体（選択） --- */}
                <div
                  className={`group-cast-card ${
                    castSelected ? "group-cast-card-selected" : ""
                  }`}
                  onClick={() => toggleSelection(cast.id)}
                >
                  <img
                    src={safeAvatar(cast.avatar_url)}
                    className="group-avatar"
                  />

                  {/* 名前 + キャスト を縦並び */}
                  <div className="group-cast-text">
                    <div className="group-member-name">{cast.name}</div>
                    <div className="group-role-cast">キャスト</div>
                  </div>
                </div>

                {/* --- 右：矢印ボタン（完全分離） --- */}
                <button
                  className="group-toggle-btn-outside"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCastOpen(cast.id);
                  }}
                >
                  {isOpen ? "▲" : "▼"}
                </button>
              </div>

              {/* 下段：ユーザ一覧 */}
              {isOpen && (
                <div className="group-user-list animate-slideDown">
                  {castUsers.length === 0 ? (
                    <div className="group-empty-text">ユーザーなし</div>
                  ) : (
                    castUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`group-user-card ${
                          selectedIds.has(user.id)
                            ? "group-user-card-selected"
                            : ""
                        }`}
                        onClick={() => toggleSelection(user.id)}
                      >
                        <div className="group-user-info">
                          <img
                            src={safeAvatar(user.avatar_url)}
                            className="group-avatar-sm"
                          />
                          <div>
                            <div className="group-member-name">{user.name}</div>
                            <div className="group-member-role">お客様</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
