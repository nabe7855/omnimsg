"use client";

import { APP_NAME } from "@/constants";
import { supabase } from "@/lib/supabaseClient";
import { UserRole } from "@/lib/types";
import { LoginProps } from "@/lib/types/screen";
import Link from "next/link"; // ★追加: 規約リンク用
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

// 店舗用のデフォルトアイコン
const DEFAULT_STORE_ICON = "/default-store.jpg";

// ==========================================
// ★追加: 外部送信同意ポップアップコンポーネント
// ==========================================
const ExternalTransmissionConsentModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)", // 背景を少し暗く
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onCancel} // 背景クリックで閉じる
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
        onClick={(e) => e.stopPropagation()} // 中身クリックでは閉じない
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

// ==========================================
// メインコンポーネント
// ==========================================
export const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [selectedIconId, setSelectedIconId] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // ★追加: 規約同意チェックボックスの状態
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // ★追加: 外部送信同意ポップアップの表示状態
  const [showExternalConsent, setShowExternalConsent] = useState(false);

  // 再送信ボタンの表示管理
  const [showResend, setShowResend] = useState(false);

  // URLパラメータのエラーチェック
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorDescription = searchParams.get("error_description");
    const errorCode = searchParams.get("error_code");

    if (errorCode === "otp_expired") {
      alert(
        "認証リンクの有効期限が切れているか、既に使用されています。\nログインを試みて、メール未確認の場合は再送信を行ってください。"
      );
    } else if (errorDescription) {
      console.error("Auth Error:", errorDescription);
    }
  }, [searchParams]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegister(false);
    setEmail("");
    setPassword("");
    setName("");
    setSelectedIconId(1);
    setShowResend(false);
    setAgreedToTerms(false); // リセット
  };

  const handleBack = () => {
    setSelectedRole(null);
    setShowResend(false);
  };

  // 確認メール再送信処理
  const handleResendEmail = async () => {
    if (!email) return alert("メールアドレスを入力してください");

    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      alert("確認メールを再送信しました。メールボックスを確認してください。");
      setShowResend(false);
    } catch (e: any) {
      alert("再送信に失敗しました: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ★追加: 登録ボタンが押されたときの処理（ポップアップ表示判断）
  const handlePreSubmit = () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    if (isRegister) {
      // 新規登録の場合のチェック
      if (!name) {
        alert("お名前を入力してください");
        return;
      }
      if (!agreedToTerms) {
        alert("利用規約への同意が必要です");
        return;
      }
      // 新規登録なら、ここで外部送信の同意ポップアップを出す
      setShowExternalConsent(true);
    } else {
      // ログインならそのまま実行
      handleSubmit(false);
    }
  };

  // ==========================================================
  // 🚀 Supabase 認証処理 (メイン)
  // ==========================================================
  const handleSubmit = async (isNewRegistration: boolean) => {
    setIsProcessing(true);
    setShowResend(false);

    try {
      // ---------------------------
      // ① 新規登録の場合
      // ---------------------------
      if (isNewRegistration) {
        const redirectTo = `${window.location.origin}/auth/callback`;

        let initialAvatarUrl = "";
        if (selectedRole === UserRole.STORE) {
          initialAvatarUrl = DEFAULT_STORE_ICON;
        } else if (selectedRole === UserRole.USER) {
          initialAvatarUrl = `/default-user/${selectedIconId}.png`;
        }

        // 現在時刻（同意日時として記録）
        const now = new Date().toISOString();

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              name: name,
              role: selectedRole,
              avatar_url: initialAvatarUrl,
              // ★メタデータとして同意日時を送信 (DBトリガーでprofilesテーブルへ保存する想定)
              agreed_to_terms_at: now,
              agreed_to_external_transmission_at: now,
            },
          },
        });

        if (error) throw error;

        alert(
          "確認メールを送信しました。\nメール内のリンクをクリックして登録を完了してください。"
        );

        setIsRegister(false);
        setShowExternalConsent(false); // モーダル閉じる
      }

      // ---------------------------
      // ② ログインの場合
      // ---------------------------
      else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            alert("メールアドレスが確認されていません。");
            setShowResend(true); // 再送信ボタンを表示
          } else if (error.message.includes("Invalid login credentials")) {
            alert("メールアドレスまたはパスワードが間違っています。");
          } else {
            alert("ログインエラー: " + error.message);
          }
          return;
        }

        await onLogin(selectedRole!, "login", email, password, name);
      }
    } catch (err: any) {
      alert(err.message || "処理に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const roleLabels: Record<UserRole, string> = {
    [UserRole.USER]: "一般ユーザー",
    [UserRole.CAST]: "キャスト",
    [UserRole.STORE]: "店舗",
    [UserRole.ADMIN]: "管理人",
  };

  const isCast = selectedRole === UserRole.CAST;

  if (!selectedRole) {
    return (
      <div className="login-screen login-screen-role-select">
        <div className="login-role-inner">
          <h1 className="login-app-title">{APP_NAME}</h1>
          <p className="login-app-subtitle">
            WEBだけでサクッとつながるコミュニケーション
            <br />
            あなたのビジネスを守る保険としてのチャットツール
          </p>
          <p className="login-role-label">利用方法を選択してください</p>
          <div className="login-role-button-group">
            <button
              onClick={() => handleRoleSelect(UserRole.USER)}
              className="login-role-button login-role-button-user"
            >
              一般ユーザーとして利用
            </button>
            <button
              onClick={() => handleRoleSelect(UserRole.CAST)}
              className="login-role-button login-role-button-cast"
            >
              キャストとして利用
            </button>
            <button
              onClick={() => handleRoleSelect(UserRole.STORE)}
              className="login-role-button login-role-button-store"
            >
              店舗として利用
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen login-screen-form">
      {/* ★追加: 外部送信同意モーダル */}
      {showExternalConsent && (
        <ExternalTransmissionConsentModal
          onConfirm={() => handleSubmit(true)} // 同意したら登録処理実行
          onCancel={() => setShowExternalConsent(false)}
        />
      )}

      <button onClick={handleBack} className="login-back-button" type="button">
        <span className="login-back-icon">←</span>
        <span>戻る</span>
      </button>

      <h2 className="login-form-title">
        {roleLabels[selectedRole]} {isRegister ? "新規登録" : "ログイン"}
      </h2>

      <div className="login-form-fields">
        {isRegister && (
          <>
            {selectedRole === UserRole.USER && (
              <div style={{ marginBottom: "20px" }}>
                <label
                  className="input-label"
                  style={{ marginBottom: "8px", display: "block" }}
                >
                  アイコンを選択
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                    maxHeight: "150px",
                    overflowY: "auto",
                    padding: "4px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((id) => (
                    <img
                      key={id}
                      src={`/default-user/${id}.png`}
                      alt={`icon-${id}`}
                      onClick={() => setSelectedIconId(id)}
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        cursor: "pointer",
                        borderRadius: "50%",
                        border:
                          selectedIconId === id
                            ? "3px solid #6b46c1"
                            : "1px solid transparent",
                        transition: "all 0.2s",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">アカウント名</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="input-group">
          <label className="input-label">メールアドレス</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">パスワード</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* ★追加: 利用規約同意チェックボックス (新規登録時のみ) */}
        {isRegister && (
          <div
            style={{ margin: "20px 0", fontSize: "14px", lineHeight: "1.5" }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ marginTop: "4px" }}
              />
              <span style={{ color: "#333" }}>
                <Link
                  href="/terms"
                  target="_blank"
                  style={{ color: "#007aff", textDecoration: "underline" }}
                  onClick={(e) => e.stopPropagation()} // リンククリックでチェックボックスが反応しないように
                >
                  利用規約
                </Link>
                （ログ確認・削除権限等を含む）に同意します。
              </span>
            </label>
          </div>
        )}

        {/* 登録ボタン（プレチェック関数を呼ぶように変更） */}
        <button
          onClick={handlePreSubmit}
          disabled={isProcessing || (isRegister && !agreedToTerms)} // ★規約未同意なら無効化
          className="login-submit-button"
          style={{
            opacity: isRegister && !agreedToTerms ? 0.5 : 1,
            cursor: isRegister && !agreedToTerms ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing
            ? "処理中..."
            : isRegister
            ? "次へ" // ★変更: ポップアップが出るため
            : "ログイン"}
        </button>

        {/* 再送信ボタン（ログイン失敗時に表示） */}
        {showResend && !isRegister && (
          <div style={{ marginTop: "15px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "red", marginBottom: "5px" }}>
              メール認証が完了していません。
            </p>
            <button
              onClick={handleResendEmail}
              disabled={isProcessing}
              style={{
                background: "none",
                border: "1px solid #6b46c1",
                color: "#6b46c1",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              確認メールを再送信する
            </button>
          </div>
        )}

        {!isCast && (
          <div className="login-toggle-area">
            <div className="login-toggle-message">
              {isRegister
                ? "すでにアカウントをお持ちですか？"
                : "アカウントをお持ちでないですか？"}
            </div>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setShowResend(false);
                setAgreedToTerms(false); // 切り替え時にリセット
              }}
              className="login-toggle-link"
            >
              {isRegister ? "ログイン画面へ" : "新規登録する"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
