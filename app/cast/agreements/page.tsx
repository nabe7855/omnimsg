"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CastAgreementsPage() {
  const router = useRouter();
  const [termsChecked, setTermsChecked] = useState(false);
  const [externalChecked, setExternalChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const checkUserAndStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        setUserId(user.id);

        // 既に同意済みかチェック
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("agreed_to_terms_at, agreed_to_external_transmission_at")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profile fetch error:", error);
          // ※ここでエラーが出る場合、RLS（権限）設定が足りていません（後述）
        }

        if (
          profile?.agreed_to_terms_at &&
          profile?.agreed_to_external_transmission_at
        ) {
          console.log("Already agreed, redirecting...");
          window.location.href = "/home";
          return;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingUser(false);
      }
    };

    checkUserAndStatus();
  }, []);

  const handleAgree = async () => {
    if (!userId || !termsChecked || !externalChecked) return;
    setIsSubmitting(true);
    console.log("Start agreement process...");

    const now = new Date().toISOString();

    try {
      // 1. データベースを更新
      const { error } = await supabase
        .from("profiles")
        .update({
          agreed_to_terms_at: now,
          agreed_to_external_transmission_at: now,
        })
        .eq("id", userId);

      if (error) throw error;

      console.log("DB Updated. Redirecting to home...");

      // 2. セッションリフレッシュは削除（window.location.hrefで再読込されるため不要）
      // await supabase.auth.refreshSession();  <-- これが原因で止まることがあるので削除

      // 3. ホームへ強制移動
      window.location.href = "/home";
    } catch (error: any) {
      console.error("Agreement Error:", error);
      alert("エラーが発生しました: " + error.message);
      setIsSubmitting(false);
    }
  };

  // ... (描画部分はそのまま) ...
  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#333333",
        position: "relative",
        zIndex: 9999,
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "30px",
          textAlign: "center",
        }}
      >
        サービス利用開始の前に
      </h1>

      <p style={{ marginBottom: "30px", textAlign: "center" }}>
        サービスをご利用いただくには、以下の「利用規約」および「情報外部送信について」の内容を確認し、同意いただく必要があります。
      </p>

      {/* 1. 利用規約セクション */}
      <div
        style={{
          marginBottom: "40px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}
        >
          利用規約
        </h2>
        <div
          style={{
            height: "200px",
            overflowY: "scroll",
            border: "1px solid #eee",
            padding: "10px",
            marginBottom: "15px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <p>
            <strong>第1条（禁止事項）</strong>
          </p>
          <p>
            ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません...
          </p>
          <p style={{ marginTop: "10px", fontSize: "0.9em", color: "#666" }}>
            ※全文は
            <a
              href="/terms"
              target="_blank"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              こちら
            </a>
            からご確認いただけます。
          </p>
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            gap: "10px",
          }}
        >
          <input
            type="checkbox"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            style={{ width: "20px", height: "20px" }}
          />
          <span style={{ fontWeight: "bold" }}>利用規約に同意します</span>
        </label>
      </div>

      {/* 2. 外部送信規律セクション */}
      <div
        style={{
          marginBottom: "40px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}
        >
          情報外部送信について
        </h2>
        <div
          style={{
            height: "200px",
            overflowY: "scroll",
            border: "1px solid #eee",
            padding: "10px",
            marginBottom: "15px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <p>
            当アプリでは、広告配信および利用状況の分析のために、以下の第三者が提供するサービスを利用しており...
          </p>
          <p style={{ marginTop: "10px", fontSize: "0.9em", color: "#666" }}>
            ※詳細は
            <a
              href="/external-transmission"
              target="_blank"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              こちら
            </a>
            からご確認いただけます。
          </p>
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            gap: "10px",
          }}
        >
          <input
            type="checkbox"
            checked={externalChecked}
            onChange={(e) => setExternalChecked(e.target.checked)}
            style={{ width: "20px", height: "20px" }}
          />
          <span style={{ fontWeight: "bold" }}>上記の内容を確認しました</span>
        </label>
      </div>

      <div style={{ textAlign: "center", paddingBottom: "50px" }}>
        <button
          onClick={handleAgree}
          disabled={
            loadingUser ||
            !userId ||
            !termsChecked ||
            !externalChecked ||
            isSubmitting
          }
          style={{
            padding: "15px 40px",
            fontSize: "16px",
            borderRadius: "30px",
            border: "none",
            backgroundColor:
              termsChecked && externalChecked && !loadingUser
                ? "#6b46c1"
                : "#ccc",
            color: "white",
            cursor:
              termsChecked && externalChecked && !loadingUser
                ? "pointer"
                : "not-allowed",
            fontWeight: "bold",
          }}
        >
          {isSubmitting
            ? "処理中..."
            : loadingUser
            ? "読み込み中..."
            : "同意してはじめる"}
        </button>
      </div>
    </div>
  );
}
