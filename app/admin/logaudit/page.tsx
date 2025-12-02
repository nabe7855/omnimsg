"use client";

import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  Globe,
  Lock,
  MessageCircle,
  Monitor,
  Plus,
  Search,
  Server,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import styles from "./log-audit.module.css";

// 定数・型のインポート
import { MOCK_CHAT_LOGS, MOCK_CHAT_ROOMS, MOCK_LOGS } from "@/adminconstants";
import { AuditLog, ChatMessage, ChatRoom } from "@/lib/types";

// アクションID定義
const ACTION_DEF: Record<
  string,
  { label: string; icon: React.ElementType; styleKey: string }
> = {
  VIEW_LOG: { label: "ログ閲覧", styleKey: "bgBlue", icon: Eye },
  USER_SUSPEND: { label: "ユーザー凍結", styleKey: "bgOrange", icon: Shield },
  AUTO_BAN: { label: "自動BAN執行", styleKey: "bgRed", icon: Server },
  EXPORT_CSV: { label: "CSV出力", styleKey: "bgGreen", icon: FileText },
  MSG_INSPECT: { label: "メッセージ監査", styleKey: "bgPurple", icon: Lock },
};

const DEFAULT_ACTION = {
  label: "その他操作",
  styleKey: "bgSlate",
  icon: Activity,
};

type TabType = "SYSTEM_LOGS" | "MESSAGE_INSPECTOR";
type InspectorStep = "SEARCH" | "CONFIRM_ACCESS" | "VIEWER";

export default function LogAudit() {
  const [activeTab, setActiveTab] = useState<TabType>("SYSTEM_LOGS");

  // === システムログ用 State ===
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_LOGS);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // === メッセージ監査用 State ===
  const [inspectorStep, setInspectorStep] = useState<InspectorStep>("SEARCH");

  // 1. 検索条件
  const [searchTargetId, setSearchTargetId] = useState("");
  const [searchChatType, setSearchChatType] = useState<"ALL" | "DM" | "GROUP">(
    "ALL"
  );
  const [filterGroupUserIds, setFilterGroupUserIds] = useState<string[]>([]);
  const [tempFilterId, setTempFilterId] = useState("");

  // 2. 検索結果・選択
  const [foundRooms, setFoundRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);

  // 3. 監査申請フォーム
  const [inspectForm, setInspectForm] = useState({
    reasonType: "REPORT", // REPORT | POLICE
    referenceId: "",
    adminNote: "",
  });
  const [inspectError, setInspectError] = useState("");

  // 4. 閲覧データ
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([]);

  // 表示用ヘルパー関数
  const getActionInfo = (actionKey: string) => {
    return ACTION_DEF[actionKey] || { ...DEFAULT_ACTION, label: actionKey };
  };

  // --- メッセージ監査ロジック ---
  const handleSearch = () => {
    if (!searchTargetId) {
      setFoundRooms([]);
      return;
    }
    const result = MOCK_CHAT_ROOMS.filter((room) => {
      const hasTarget = room.memberIds.includes(searchTargetId);
      if (!hasTarget) return false;
      if (searchChatType !== "ALL" && room.type !== searchChatType)
        return false;
      if (room.type === "GROUP" && filterGroupUserIds.length > 0) {
        const hasAllFilters = filterGroupUserIds.every((uid) =>
          room.memberIds.includes(uid)
        );
        if (!hasAllFilters) return false;
      }
      return true;
    });
    setFoundRooms(result);
  };

  const addFilterUser = () => {
    if (tempFilterId && !filterGroupUserIds.includes(tempFilterId)) {
      setFilterGroupUserIds([...filterGroupUserIds, tempFilterId]);
      setTempFilterId("");
    }
  };

  const removeFilterUser = (id: string) => {
    setFilterGroupUserIds(filterGroupUserIds.filter((uid) => uid !== id));
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setInspectorStep("CONFIRM_ACCESS");
    setInspectError("");
  };

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (!inspectForm.referenceId || !inspectForm.adminNote) {
      setInspectError("全ての項目を入力してください。閲覧理由は必須です。");
      return;
    }

    const logs = MOCK_CHAT_LOGS.filter((msg) => msg.roomId === selectedRoom.id);
    setChatLogs(logs);
    setInspectorStep("VIEWER");

    const newAuditLog: AuditLog = {
      id: `l${Date.now()}`,
      adminName: "Admin-User",
      action: "MSG_INSPECT",
      target: `Room: ${selectedRoom.id} (${selectedRoom.type})`,
      timestamp: new Date().toLocaleString("ja-JP"),
      ipAddress: "192.168.1.10",
      userAgent: navigator.userAgent,
      metadata: {
        targetUser: searchTargetId,
        participants: selectedRoom.memberIds,
        reasonType: inspectForm.reasonType,
        referenceId: inspectForm.referenceId,
        adminNote: inspectForm.adminNote,
      },
    };
    setLogs((prev) => [newAuditLog, ...prev]);
  };

  const resetInspector = () => {
    setInspectorStep("SEARCH");
    setSelectedRoom(null);
    setChatLogs([]);
    setInspectForm({ ...inspectForm, referenceId: "", adminNote: "" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <FileText className={styles.titleIcon} />
            監査ログ・調査
          </h2>
          <p className={styles.description}>
            システム操作履歴の確認および特権権限によるメッセージ調査を行います。
          </p>
        </div>
        <div className={styles.securityBadge}>
          <Shield className={styles.securityIcon} />
          ログ改ざん防止システム稼働中
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button
          onClick={() => setActiveTab("SYSTEM_LOGS")}
          className={`${styles.tabButton} ${
            activeTab === "SYSTEM_LOGS"
              ? styles.tabActiveSystem
              : styles.tabInactive
          }`}
        >
          管理操作ログ
        </button>
        <button
          onClick={() => setActiveTab("MESSAGE_INSPECTOR")}
          className={`${styles.tabButton} ${
            activeTab === "MESSAGE_INSPECTOR"
              ? styles.tabActiveMsg
              : styles.tabInactive
          }`}
        >
          <Lock className={styles.tabIcon} />
          メッセージ監査 (特権)
        </button>
      </div>

      {activeTab === "SYSTEM_LOGS" ? (
        // === システムログ一覧 ===
        <div className={styles.panel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th} style={{ width: "12rem" }}>
                    日時 (Timestamp)
                  </th>
                  <th className={styles.th} style={{ width: "10rem" }}>
                    実行者 (Actor)
                  </th>
                  <th className={styles.th} style={{ width: "12rem" }}>
                    操作内容 (Action)
                  </th>
                  <th className={styles.th}>対象リソース (Target)</th>
                  <th
                    className={styles.th}
                    style={{ width: "5rem", textAlign: "center" }}
                  >
                    詳細
                  </th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {logs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  const ActionIcon = actionInfo.icon;
                  // stylesから動的にクラスを取得 (例: styles.bgBlue)
                  const badgeClass =
                    styles[actionInfo.styleKey as keyof typeof styles] ||
                    styles.bgSlate;

                  return (
                    <tr key={log.id} onClick={() => setSelectedLog(log)}>
                      <td className={`${styles.td} ${styles.tdTimestamp}`}>
                        {log.timestamp}
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className={styles.adminAvatar}>
                            {log.adminName.slice(0, 2)}
                          </div>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: "#334155",
                            }}
                          >
                            {log.adminName}
                          </span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.actionBadge} ${badgeClass}`}>
                          <ActionIcon
                            size={12}
                            style={{ marginRight: "6px" }}
                          />
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.targetResource}>
                          {log.target}
                        </div>
                      </td>
                      <td className={styles.td} style={{ textAlign: "center" }}>
                        <button className={styles.viewBtn}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // === メッセージ監査機能 ===
        <div className={styles.panel}>
          {/* STEP 1: 検索 & ルーム選択 */}
          {inspectorStep === "SEARCH" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div className={styles.searchHeader}>
                <div className={styles.searchTitleRow}>
                  <div className={styles.searchIconWrapper}>
                    <Search size={24} color="#9333ea" />
                  </div>
                  <div>
                    <h3 className={styles.searchTitle}>トーク履歴検索</h3>
                    <p className={styles.description} style={{ marginTop: 0 }}>
                      ユーザーIDを指定して、関連するDM・グループトークを特定します。
                    </p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <label className={styles.label}>
                      調査対象ユーザーID (必須)
                    </label>
                    <div className={styles.inputGroup}>
                      <input
                        type="text"
                        value={searchTargetId}
                        onChange={(e) => setSearchTargetId(e.target.value)}
                        placeholder="例: u002"
                        className={styles.input}
                      />
                      <button
                        onClick={handleSearch}
                        className={styles.primaryBtn}
                      >
                        検索
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <label className={styles.label}>チャット種別</label>
                    <div className={styles.typeFilter}>
                      {(["ALL", "DM", "GROUP"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSearchChatType(type);
                            if (searchTargetId) handleSearch();
                          }}
                          className={`${styles.typeBtn} ${
                            searchChatType === type ? styles.typeBtnActive : ""
                          }`}
                        >
                          {type === "ALL" ? "すべて" : type}
                        </button>
                      ))}
                    </div>

                    {searchChatType === "GROUP" && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          animation: "fadeIn 0.3s",
                        }}
                      >
                        <label
                          className={styles.label}
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <Filter size={12} style={{ marginRight: "4px" }} />
                          同席ユーザーで絞り込み (AND)
                        </label>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {filterGroupUserIds.map((uid) => (
                            <span key={uid} className={styles.filterTag}>
                              {uid}
                              <button
                                onClick={() => removeFilterUser(uid)}
                                className={styles.removeFilterBtn}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            value={tempFilterId}
                            onChange={(e) => setTempFilterId(e.target.value)}
                            placeholder="追加ID (例: u005)"
                            className={styles.input}
                            style={{ width: "8rem", flex: "none" }}
                          />
                          <button
                            onClick={() => {
                              addFilterUser();
                              if (searchTargetId) setTimeout(handleSearch, 0);
                            }}
                            className={styles.addBtn}
                          >
                            <Plus size={12} style={{ marginRight: "4px" }} />{" "}
                            追加
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.resultArea}>
                <h4 className={styles.resultCount}>
                  検索結果
                  <span className={styles.countBadge}>
                    {foundRooms.length}件
                  </span>
                </h4>

                {foundRooms.length === 0 ? (
                  <div className={styles.emptyState}>
                    <MessageCircle
                      size={48}
                      style={{ opacity: 0.2, margin: "0 auto 0.5rem" }}
                    />
                    <p>条件に一致するチャットルームはありません</p>
                    <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      IDを入力して検索してください
                    </p>
                  </div>
                ) : (
                  <div className={styles.roomGrid}>
                    {foundRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={styles.roomCard}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            className={`${styles.roomTypeBadge} ${
                              room.type === "DM"
                                ? styles.badgeDM
                                : styles.badgeGroup
                            }`}
                          >
                            {room.type}
                          </span>
                          <span className={styles.roomId}>ID: {room.id}</span>
                        </div>

                        <h5 className={styles.roomName}>
                          {room.name ||
                            (room.type === "DM"
                              ? "ダイレクトメッセージ"
                              : "名称未設定グループ")}
                        </h5>

                        <div className={styles.lastActive}>
                          <Clock size={12} style={{ marginRight: "4px" }} />
                          最終アクティブ: {room.lastActiveAt}
                        </div>

                        <div className={styles.membersSection}>
                          <p className={styles.membersLabel}>
                            <Users size={12} style={{ marginRight: "4px" }} />
                            参加メンバー ({room.memberIds.length})
                          </p>
                          <div>
                            {room.memberIds.map((mid) => (
                              <span
                                key={mid}
                                className={`${styles.memberTag} ${
                                  mid === searchTargetId
                                    ? styles.memberTagTarget
                                    : styles.memberTagNormal
                                }`}
                              >
                                {mid}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: アクセス権限確認フォーム */}
          {inspectorStep === "CONFIRM_ACCESS" && selectedRoom && (
            <div className={styles.confirmOverlay}>
              <div style={{ maxWidth: "36rem", width: "100%" }}>
                <button onClick={resetInspector} className={styles.backBtn}>
                  <ArrowLeft size={16} style={{ marginRight: "4px" }} /> 戻る
                </button>

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className={styles.confirmIconWrapper}>
                      <Lock size={32} color="#94a3b8" />
                    </div>
                  </div>
                  <h3 className={styles.confirmTitle}>アクセス権限の確認</h3>
                  <div className={styles.targetInfoBox}>
                    <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Target Room:
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      {selectedRoom.id}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginTop: "0.25rem",
                      }}
                    >
                      Participants:
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#334155" }}>
                      {selectedRoom.memberIds.join(", ")}
                    </p>
                  </div>
                  <p className={styles.warningText}>
                    この操作は全て監査ログに記録され、永久に保存されます。
                  </p>
                </div>

                <form
                  onSubmit={handleInspectSubmit}
                  className={styles.inspectForm}
                >
                  {inspectError && (
                    <div className={styles.errorBox}>
                      <AlertOctagon
                        size={20}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {inspectError}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <label className={styles.label}>閲覧区分</label>
                      <select
                        className={styles.select}
                        value={inspectForm.reasonType}
                        onChange={(e) =>
                          setInspectForm({
                            ...inspectForm,
                            reasonType: e.target.value,
                          })
                        }
                      >
                        <option value="REPORT">通報調査・事実確認</option>
                        <option value="POLICE">警察・弁護士会照会</option>
                      </select>
                    </div>
                    <div>
                      <label className={styles.label}>
                        関連ID (通報ID / 照会番号)
                      </label>
                      <input
                        type="text"
                        placeholder="例: r001, CASE-2023-99"
                        className={styles.input}
                        value={inspectForm.referenceId}
                        onChange={(e) =>
                          setInspectForm({
                            ...inspectForm,
                            referenceId: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className={styles.label}>閲覧理由 (詳細)</label>
                    <textarea
                      className={styles.textarea}
                      rows={3}
                      placeholder="具体的な調査理由、または照会内容を記載してください。"
                      value={inspectForm.adminNote}
                      onChange={(e) =>
                        setInspectForm({
                          ...inspectForm,
                          adminNote: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>

                  <button type="submit" className={styles.submitBtn}>
                    <Eye size={20} style={{ marginRight: "0.5rem" }} />
                    ログを閲覧する
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 3: ログ閲覧ビュー */}
          {inspectorStep === "VIEWER" && selectedRoom && (
            <div className={styles.viewerContainer}>
              <div className={styles.viewerHeader}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className={styles.recordingDot}></div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      Secure Log Viewer
                    </h3>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#94a3b8",
                        fontFamily: "monospace",
                      }}
                    >
                      Room: {selectedRoom.id}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    style={{
                      fontSize: "0.75rem",
                      background: "#1e293b",
                      color: "white",
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.25rem",
                      border: "1px solid #475569",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Download size={12} style={{ marginRight: "6px" }} />
                    CSV Export
                  </button>
                  <button
                    onClick={resetInspector}
                    style={{
                      fontSize: "0.75rem",
                      background: "#dc2626",
                      color: "white",
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.25rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    閲覧終了
                  </button>
                </div>
              </div>

              <div className={styles.viewerContent}>
                {chatLogs.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      marginTop: "2.5rem",
                    }}
                  >
                    <p>メッセージ履歴はありません。</p>
                  </div>
                ) : (
                  chatLogs.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.msgRow} ${
                        msg.senderId === searchTargetId
                          ? styles.msgRowRight
                          : styles.msgRowLeft
                      }`}
                    >
                      <div
                        className={styles.msgBubbleContainer}
                        style={{
                          alignItems:
                            msg.senderId === searchTargetId
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        <div className={styles.msgInfo}>
                          <span className={styles.msgSender}>
                            {msg.senderName}
                          </span>
                          <span className={styles.msgId}>{msg.senderId}</span>
                          <span className={styles.msgTime}>
                            {msg.timestamp}
                          </span>
                        </div>
                        <div
                          className={`${styles.msgBubble} ${
                            msg.senderId === searchTargetId
                              ? styles.bubbleTarget
                              : styles.bubbleOther
                          }`}
                        >
                          {msg.type === "IMAGE" ? (
                            <div className={styles.imgWrapper}>
                              {/* Next.js Image component recommended */}
                              <img
                                src={msg.content}
                                className={styles.blurImg}
                                alt="sent image"
                              />
                              <div className={styles.imgOverlay}>
                                <span className={styles.overlayText}>
                                  Hover to View
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 詳細モーダル (システムログ用) */}
      {selectedLog && activeTab === "SYSTEM_LOGS" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  ログ詳細情報
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontFamily: "monospace",
                    marginTop: "0.25rem",
                  }}
                >
                  ID: {selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.modalBody}>
              {/* Summary Panel */}
              <div className={styles.infoPanel}>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#3b82f6",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <Clock size={12} style={{ marginRight: "4px" }} /> 実行日時
                  </span>
                  <p
                    style={{
                      color: "#1e293b",
                      fontFamily: "monospace",
                      fontWeight: 500,
                    }}
                  >
                    {selectedLog.timestamp}
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#3b82f6",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <User size={12} style={{ marginRight: "4px" }} />{" "}
                    実行ユーザー
                  </span>
                  <p style={{ color: "#1e293b", fontWeight: 500 }}>
                    {selectedLog.adminName}
                  </p>
                </div>
              </div>

              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {/* Action Info */}
                <div>
                  <h4 className={styles.sectionTitle}>操作コンテキスト</h4>
                  <div style={{ marginBottom: "1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      操作種別
                    </span>
                    {(() => {
                      const info = getActionInfo(selectedLog.action);
                      const badgeClass =
                        styles[info.styleKey as keyof typeof styles] ||
                        styles.bgSlate;
                      return (
                        <span className={`${styles.actionBadge} ${badgeClass}`}>
                          {info.label} ({selectedLog.action})
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      対象リソース
                    </span>
                    <div
                      style={{
                        background: "#f1f5f9",
                        padding: "0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.875rem",
                        color: "#334155",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }}
                    >
                      {selectedLog.target}
                    </div>
                  </div>
                </div>

                {/* Network Info */}
                <div>
                  <h4 className={styles.sectionTitle}>接続情報</h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginBottom: "1rem",
                    }}
                  >
                    <Globe
                      size={16}
                      style={{
                        color: "#94a3b8",
                        marginRight: "0.5rem",
                        marginTop: "2px",
                      }}
                    />
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          display: "block",
                        }}
                      >
                        IPアドレス
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontFamily: "monospace",
                          color: "#334155",
                        }}
                      >
                        {selectedLog.ipAddress || "記録なし"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <Monitor
                      size={16}
                      style={{
                        color: "#94a3b8",
                        marginRight: "0.5rem",
                        marginTop: "2px",
                      }}
                    />
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          display: "block",
                        }}
                      >
                        端末情報 (User Agent)
                      </span>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#475569",
                          background: "#f8fafc",
                          padding: "0.5rem",
                          borderRadius: "0.25rem",
                          marginTop: "0.25rem",
                          lineHeight: 1.5,
                          wordBreak: "break-all",
                        }}
                      >
                        {selectedLog.userAgent || "記録なし"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <h4
                    className={styles.sectionTitle}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <Database size={16} style={{ marginRight: "0.5rem" }} />
                    詳細パラメータ
                  </h4>
                  <div className={styles.jsonTableWrapper}>
                    <table className={styles.jsonTable}>
                      <tbody>
                        {Object.entries(selectedLog.metadata).map(
                          ([key, value]) => (
                            <tr
                              key={key}
                              style={{ borderBottom: "1px solid #334155" }}
                            >
                              <td className={styles.jsonKey}>{key}</td>
                              <td className={styles.jsonValue}>
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button
                onClick={() => setSelectedLog(null)}
                className={styles.modalCloseBtn}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
