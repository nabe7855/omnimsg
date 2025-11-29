"use client";

import { Profile } from "@/lib/types";
import { safeAvatar } from "@/lib/utils/avatar";
import React, { useState } from "react";

type Props = {
  cast: Profile;
  users: Profile[];
  selectedIds: Set<string>;
  toggle: (id: string) => void;
};

export const CastAccordionItem: React.FC<Props> = ({
  cast,
  users,
  selectedIds,
  toggle,
}) => {
  const [open, setOpen] = useState(false);

  const isSelected = selectedIds.has(cast.id);

  return (
    <div className="border-b border-gray-200 pb-2 mb-2">
      {/* Cast Card */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg shadow-sm cursor-pointer transition ${
          isSelected ? "bg-indigo-50" : "bg-white"
        }`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <img
            src={safeAvatar(cast.avatar_url)}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{cast.name}</span>
            <span className="text-sm text-pink-500">キャスト</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 選択丸アイコン */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggle(cast.id);
            }}
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
              isSelected ? "bg-indigo-500 border-indigo-500" : "border-gray-400"
            }`}
          >
            {isSelected && <span className="text-white text-xs">✓</span>}
          </div>

          {/* 開閉アイコン（▲▼ で代替） */}
          <span className="text-gray-600 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* ▼ ユーザー一覧（にょきっと開く） */}
      {open && (
        <div className="mt-2 ml-12 space-y-2 animate-fadeIn">
          {users.length === 0 && (
            <p className="text-sm text-gray-400">ユーザーがいません</p>
          )}

          {users.map((u) => {
            const isUserSelected = selectedIds.has(u.id);

            return (
              <div
                key={u.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  isUserSelected ? "bg-indigo-100" : "bg-gray-50"
                }`}
                onClick={() => toggle(u.id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={safeAvatar(u.avatar_url)}
                    className="w-8 h-8 rounded-full"
                  />
                  <p className="text-sm text-gray-800">{u.name}</p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                    isUserSelected
                      ? "bg-indigo-500 border-indigo-500"
                      : "border-gray-400"
                  }`}
                >
                  {isUserSelected && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
