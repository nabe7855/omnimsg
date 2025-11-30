import { RoomWithPartner } from "@/lib/types";
import React from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

type Props = {
  room: RoomWithPartner | null;
  onClick: () => void;
};

export const ChatHeader: React.FC<Props> = ({ room, onClick }) => {
  if (!room) return null;

  const title =
    room.type === "group"
      ? room.group_name
      : room.partner?.name || "退会済みユーザー";
  const image =
    room.type === "group"
      ? `https://ui-avatars.com/api/?name=${title}&background=random`
      : room.partner?.avatar_url || PLACEHOLDER_AVATAR;

  return (
    <div className="chat-header">
      <div
        className="chat-header-main"
        onClick={onClick}
        style={{ cursor: "pointer", marginLeft: "8px" }}
      >
        <img
          src={image}
          className="chat-header-avatar"
          alt="icon"
          onError={(e) =>
            ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
          }
        />
        <div className="chat-header-text">
          <span className="chat-header-title">{title}</span>
          {room.type === "group" && (
            <span className="chat-header-subtitle">
              {room.member_ids.length}人のメンバー &gt;
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
