import { Profile, UserRole } from "@/lib/types";
import React, { useEffect, useState } from "react";

const PLACEHOLDER_AVATAR = "/placeholder-avatar.png";

type Props = {
  currentUser: Profile;
  currentMembers: Profile[];
  onClose: () => void;
  onRemoveMember: (id: string) => void;
  onAddMember: (profile: Profile) => void;
  fetchAddCandidates: () => void;
  addCandidates: Profile[];
  isLoadingCandidates: boolean;
};

export const MemberModal: React.FC<Props> = ({
  currentUser,
  currentMembers,
  onClose,
  onRemoveMember,
  onAddMember,
  fetchAddCandidates,
  addCandidates,
  isLoadingCandidates,
}) => {
  const [isAddingMode, setIsAddingMode] = useState(false);

  useEffect(() => {
    if (isAddingMode) fetchAddCandidates();
  }, [isAddingMode, fetchAddCandidates]);

  const isOwner = currentUser.role === UserRole.STORE;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "400px",
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "20px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px" }}>
            {isAddingMode ? "メンバーを追加" : "メンバー一覧"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ×
          </button>
        </div>

        {!isAddingMode ? (
          <>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {currentMembers.map((member) => (
                <li
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <img
                    src={member.avatar_url || PLACEHOLDER_AVATAR}
                    alt={member.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "10px",
                    }}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR)
                    }
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold" }}>{member.name}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {member.role === UserRole.STORE
                        ? "店舗"
                        : member.role === UserRole.CAST
                        ? "キャスト"
                        : "お客様"}
                    </div>
                  </div>
                  {isOwner && member.id !== currentUser.id && (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      style={{
                        backgroundColor: "#ff4444",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      削除
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {isOwner && (
              <button
                onClick={() => setIsAddingMode(true)}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#6b46c1",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                + メンバーを追加する
              </button>
            )}
          </>
        ) : (
          <>
            {isLoadingCandidates ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                読み込み中...
              </p>
            ) : addCandidates.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                追加できる候補がいません
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {addCandidates.map((candidate) => (
                  <li
                    key={candidate.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <img
                      src={candidate.avatar_url || PLACEHOLDER_AVATAR}
                      alt={candidate.name}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginRight: "10px",
                      }}
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src =
                          PLACEHOLDER_AVATAR)
                      }
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold" }}>{candidate.name}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        {candidate.role === UserRole.CAST
                          ? "キャスト"
                          : "お客様"}
                      </div>
                    </div>
                    <button
                      onClick={() => onAddMember(candidate)}
                      style={{
                        backgroundColor: "#6b46c1",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      追加
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setIsAddingMode(false)}
              style={{
                width: "100%",
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#ccc",
                color: "#333",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              一覧に戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
};
