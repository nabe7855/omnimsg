"use client";

import { ExternalTransmissionConsentModal } from "@/components/modals/ExternalTransmissionConsentModal";
import { supabase } from "@/lib/supabaseClient";
import { UserRole } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

// 店舗用のデフォルトアイコン
const DEFAULT_STORE_ICON = "/default-store.jpg";

interface AuthFormScreenProps {
  selectedRole: UserRole;
  onBack: () => void;
  onLogin: (
    role: UserRole,
    mode: "login" | "register",
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;
}

export const AuthFormScreen: React.FC<AuthFormScreenProps> = ({
  selectedRole,
  onBack,
  onLogin,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedIconId, setSelectedIconId] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showExternalConsent, setShowExternalConsent] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const errorDescription = searchParams.get("error_description");
    const errorCode = searchParams.get("error_code");

    if (errorCode === "otp_expired") {
      alert(
        "認証リンクの有効期限が切れているか、既に使用されています。\\nログインを試みて、メール未確認の場合は再送信を行ってください。"
      );
    } else if (errorDescription) {
      console.error("Auth Error:", errorDescription);
    }
  }, [searchParams]);

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

  const handlePreSubmit = () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    if (isRegister) {
      if (!name) {
        alert("お名前を入力してください");
        return;
      }
      if (!agreedToTerms) {
        alert("利用規約への同意が必要です");
        return;
      }
      setShowExternalConsent(true);
    } else {
      handleSubmit(false);
    }
  };

  const handleSubmit = async (isNewRegistration: boolean) => {
    setIsProcessing(true);
    setShowResend(false);

    try {
      if (isNewRegistration) {
        const redirectTo = `${window.location.origin}/auth/callback`;

        let initialAvatarUrl = "";
        if (selectedRole === UserRole.STORE) {
          initialAvatarUrl = DEFAULT_STORE_ICON;
        } else if (selectedRole === UserRole.USER) {
          initialAvatarUrl = `/default-user/${selectedIconId}.png`;
        }

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
              agreed_to_terms_at: now,
              agreed_to_external_transmission_at: now,
            },
          },
        });

        if (error) throw error;

        alert(
          "確認メールを送信しました。\\nメール内のリンクをクリックして登録を完了してください。"
        );

        setIsRegister(false);
        setShowExternalConsent(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            alert("メールアドレスが確認されていません。");
            setShowResend(true);
          } else if (error.message.includes("Invalid login credentials")) {
            alert("メールアドレスまたはパスワードが間違っています。");
          } else {
            alert("ログインエラー: " + error.message);
          }
          return;
        }

        await onLogin(selectedRole, "login", email, password, name);
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

  return (
    <div className="login-screen login-screen-form">
      {showExternalConsent && (
        <ExternalTransmissionConsentModal
          onConfirm={() => handleSubmit(true)}
          onCancel={() => setShowExternalConsent(false)}
        />
      )}

      <button onClick={onBack} className="login-back-button" type="button">
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
                  onClick={(e) => e.stopPropagation()}
                >
                  利用規約
                </Link>
                （ログ確認・削除権限等を含む）に同意します。
              </span>
            </label>
          </div>
        )}

        <button
          onClick={handlePreSubmit}
          disabled={isProcessing || (isRegister && !agreedToTerms)}
          className="login-submit-button"
          style={{
            opacity: isRegister && !agreedToTerms ? 0.5 : 1,
            cursor: isRegister && !agreedToTerms ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "処理中..." : isRegister ? "次へ" : "ログイン"}
        </button>

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
                setAgreedToTerms(false);
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
