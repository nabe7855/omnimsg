import React, { useRef, useState } from "react";

type Props = {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onSendMessage: (text: string) => void;
  onSendImage: (file: File) => void;
};

export const ChatInput: React.FC<Props> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onSendMessage,
  onSendImage,
}) => {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onSendImage(e.target.files[0]);
      e.target.value = "";
    }
  };

  return (
    <div className="chat-input-bar">
      {isRecording ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{ color: "#ff4444", fontWeight: "bold", marginLeft: "10px" }}
          >
            録音中...
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onCancelRecording}
              style={{
                background: "#ccc",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "8px 16px",
              }}
            >
              キャンセル
            </button>
            <button
              onClick={onStopRecording}
              style={{
                background: "#6b46c1",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "8px 16px",
              }}
            >
              送信
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "none",
              border: "none",
              padding: "8px",
              marginRight: "5px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              style={{ width: "24px", height: "24px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={onStartRecording}
            style={{
              background: "none",
              border: "none",
              padding: "8px",
              marginRight: "5px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              style={{ width: "24px", height: "24px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
              />
            </svg>
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="メッセージを入力..."
            className="chat-input-field"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className="chat-send-button"
          >
            送信
          </button>
        </>
      )}
    </div>
  );
};
