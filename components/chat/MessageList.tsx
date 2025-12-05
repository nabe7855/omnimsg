import { Message, MessageType, Profile } from "@/lib/types";
import React, { useEffect, useRef, useState } from "react";

type Props = {
  messages: Message[];
  currentUser: any;
  memberProfiles: Profile[];
  isGroup: boolean;
  onScrollToBottom: () => void;
  onDeleteMessage: (msg: Message) => void;
  hasRichMenu: boolean;
};

const BOTTOM_THRESHOLD_PX = 80;

// ★設定: デザインに合わせて高さを調整してください
const INPUT_BAR_HEIGHT = 150;
const RICH_MENU_HEIGHT = 100;

export const MessageList: React.FC<Props> = ({
  messages,
  currentUser,
  memberProfiles,
  isGroup,
  onScrollToBottom,
  onDeleteMessage,
  hasRichMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkIfBottom = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    const isBottom =
      scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD_PX;
    setShowScrollButton(!isBottom);
    if (isBottom) {
      onScrollToBottom();
    }
  };

  const handleScroll = () => {
    checkIfBottom();
  };

  useEffect(() => {
    checkIfBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `file-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, "_blank");
    }
  };

  if (messages.length === 0) {
    return (
      <div className="chat-messages" ref={containerRef}>
        <div className="chat-empty-message">メッセージはまだありません</div>
      </div>
    );
  }

  const buttonBottomPosition = hasRichMenu
    ? INPUT_BAR_HEIGHT + RICH_MENU_HEIGHT
    : INPUT_BAR_HEIGHT;

  return (
    <div
      className="chat-messages"
      ref={containerRef}
      onScroll={handleScroll}
      style={{ position: "relative" }}
    >
      {messages.map((m) => {
        const isMe = m.sender_id === currentUser.id;
        const sender = memberProfiles.find((p) => p.id === m.sender_id);
        const isImage = m.message_type === MessageType.IMAGE;
        const isAudio = m.message_type === MessageType.AUDIO;
        const isBot = m.message_type === MessageType.BOT_RESPONSE;

        return (
          <div
            key={m.id}
            className={`chat-message-row ${
              isMe ? "chat-message-row-right" : "chat-message-row-left"
            }`}
            style={{
              display: "flex",
              width: "100%",
              flexDirection: isMe ? "row-reverse" : "row",
              justifyContent: "flex-start",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              {!isMe && isGroup && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#555",
                    marginBottom: "2px",
                    marginLeft: "4px",
                  }}
                >
                  {sender ? sender.name : "メンバー"}
                </span>
              )}

              <div
                className={
                  isBot
                    ? "chat-bubble-bot"
                    : isMe
                    ? "chat-bubble-me"
                    : "chat-bubble-other"
                }
                // ▼▼▼ ここを修正しました ▼▼▼
                style={
                  isImage
                    ? { padding: "4px", background: "transparent" }
                    : {
                        // 日本語の自然な改行を実現する設定
                        whiteSpace: "pre-wrap", // 改行コードは維持し、幅に合わせて折り返す
                        wordBreak: "normal", // 単語の途中での不自然な改行を防ぐ
                        overflowWrap: "break-word", // URLなど長い単語は枠内で折り返す
                      }
                }
                // ▲▲▲ 修正ここまで ▲▲▲
              >
                {isImage ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <img
                      src={m.content}
                      alt="画像"
                      style={{
                        maxWidth: "200px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(m.content, "_blank")}
                    />
                    <button
                      onClick={() => handleDownload(m.content)}
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        color: "#007aff",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      保存
                    </button>
                  </div>
                ) : isAudio ? (
                  <div style={{ minWidth: "200px" }}>
                    <audio
                      controls
                      src={m.content}
                      style={{ width: "100%", height: "32px" }}
                    />
                  </div>
                ) : (
                  <>
                    {isBot && <span className="bot-label">🤖 自動応答</span>}
                    {m.content}
                  </>
                )}
              </div>
            </div>

            {isMe && (
              <button
                onClick={() => onDeleteMessage(m)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#999",
                  marginRight: "4px",
                  marginLeft: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  alignSelf: "center",
                }}
                title="削除"
              >
                ×
              </button>
            )}

            <span
              className="chat-timestamp"
              style={{
                alignSelf: "flex-end",
                paddingBottom: "2px",
                margin: "0 4px",
              }}
            >
              {new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      })}

      <div ref={endRef} />

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          style={{
            position: "fixed",
            bottom: `${buttonBottomPosition}px`,
            right: "20px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "white",
            border: "1px solid #ddd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            color: "#555",
            zIndex: 1000,
            transition: "bottom 0.3s ease",
          }}
        >
          ↓
        </button>
      )}
    </div>
  );
};
