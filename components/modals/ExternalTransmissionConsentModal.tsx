"use client";

import Link from "next/link";
import React from "react";

interface ExternalTransmissionConsentModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExternalTransmissionConsentModal: React.FC<
  ExternalTransmissionConsentModalProps
> = ({ onConfirm, onCancel }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "16px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "16px",
            textAlign: "center",
            color: "#333",
          }}
        >
          利用者情報の外部送信について
        </h3>
        <div
          style={{
            fontSize: "14px",
            lineHeight: "1.6",
            marginBottom: "24px",
            color: "#555",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <p style={{ marginBottom: "12px" }}>
            当アプリは、広告配信および利用状況分析のために、お客様の端末情報や閲覧履歴などの利用者情報を、Google等の第三者企業へ送信します。
          </p>
          <p>
            詳細については「
            <Link
              href="/external-transmission"
              target="_blank"
              style={{ color: "#6b46c1", textDecoration: "underline" }}
            >
              情報外部送信について
            </Link>
            」をご確認ください。
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "#f8f9fa",
              color: "#666",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "#6b46c1",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(107, 70, 193, 0.3)",
            }}
          >
            同意して登録
          </button>
        </div>
      </div>
    </div>
  );
};
