// src/app/external-transmission/page.tsx
import React from "react";

export default function ExternalTransmissionPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", lineHeight: "1.6", color: "#333" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>情報外部送信について</h1>
      
      <p style={{ marginBottom: "20px" }}>
        当アプリでは、広告配信および利用状況の分析のために、以下の第三者が提供するサービスを利用しており、
        お客様の利用者情報を当該第三者へ送信しています。電気通信事業法の外部送信規律に基づき、以下の通り公表します。
      </p>

      {/* ▼▼▼ Google Analyticsの例 ▼▼▼ */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
        <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>Google Analytics (Google LLC)</h3>
        <ul style={{ listStyle: "disc", paddingLeft: "20px", fontSize: "14px" }}>
          <li><strong>送信される情報：</strong>閲覧したページのURL、滞在時間、端末情報（OS、ブラウザ等）、IPアドレス、Cookie ID</li>
          <li><strong>利用目的：</strong>アプリの利用状況分析、パフォーマンス改善のため</li>
        </ul>
        <div style={{ marginTop: "10px", fontSize: "12px" }}>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#007aff", textDecoration: "underline" }}>プライバシーポリシー</a>
          <span style={{ margin: "0 8px" }}>|</span>
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: "#007aff", textDecoration: "underline" }}>オプトアウト（送信停止）</a>
        </div>
      </div>

      {/* ▼▼▼ i-mobileなど広告ASPの例（実際に使うASP名に書き換えてください） ▼▼▼ */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
        <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>i-mobile (株式会社アイモバイル)</h3>
        <ul style={{ listStyle: "disc", paddingLeft: "20px", fontSize: "14px" }}>
          <li><strong>送信される情報：</strong>広告識別子(IDFA/GAID)、IPアドレス、閲覧履歴情報</li>
          <li><strong>利用目的：</strong>お客様の興味関心に合わせた広告配信（ターゲティング広告）、広告効果測定のため</li>
        </ul>
        <div style={{ marginTop: "10px", fontSize: "12px" }}>
          <a href="https://www.i-mobile.co.jp/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: "#007aff", textDecoration: "underline" }}>プライバシーポリシー</a>
          <span style={{ margin: "0 8px" }}>|</span>
          <a href="https://www.i-mobile.co.jp/optout.html" target="_blank" rel="noopener noreferrer" style={{ color: "#007aff", textDecoration: "underline" }}>オプトアウト</a>
        </div>
      </div>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <a href="/profile" style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "#f0f0f0", borderRadius: "20px", textDecoration: "none", color: "#333" }}>
          戻る
        </a>
      </div>
    </div>
  );
}