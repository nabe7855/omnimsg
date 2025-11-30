"use client";

import { APP_NAME } from "@/constants";
import { supabase } from "@/lib/supabaseClient";
import { UserRole } from "@/lib/types";
import { LoginProps } from "@/lib/types/screen";
import React, { useState } from "react";

// 店舗用のデフォルトアイコン
const DEFAULT_STORE_ICON = "/default-store.jpg";

export const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // ユーザー用デフォルトアイコン選択用ステート
  const [selectedIconId, setSelectedIconId] = useState<number>(1);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegister(false);
    setEmail("");
    setPassword("");
    setName("");
    setSelectedIconId(1);
  };

  const handleBack = () => setSelectedRole(null);

  // ==========================================================
  // 🚀 Supabase 認証処理
  // ==========================================================
  const handleSubmit = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }
    if (isRegister && !name) {
      alert("お名前を入力してください");
      return;
    }
    if (!selectedRole) return;

    setIsProcessing(true);

    try {
      // ---------------------------
      // ① 新規登録の場合
      // ---------------------------
      if (isRegister) {
        const redirectTo = `${window.location.origin}/auth/callback`;

        // アイコンURLの決定
        let initialAvatarUrl = "";
        if (selectedRole === UserRole.STORE) {
          initialAvatarUrl = DEFAULT_STORE_ICON;
        } else if (selectedRole === UserRole.USER) {
          initialAvatarUrl = `/default-user/${selectedIconId}.png`;
        }

        // ★修正: options.data にプロフィール情報を渡す
        // これらは raw_user_meta_data に保存され、トリガー関数で使用されます
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              name: name,
              role: selectedRole,
              avatar_url: initialAvatarUrl,
              // 必要であれば他の初期値もここに追加
            },
          },
        });

        if (error) throw error;

        // ★削除: クライアント側での profiles への insert は削除しました。
        // (Supabase側のトリガー関数が自動的に作成するため)

        alert(
          "確認メールを送信しました。\nメール内のリンクをクリックして登録を完了してください。"
        );

        setIsRegister(false);
        setIsProcessing(false);
        return;
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
            alert(
              "メールアドレスが確認されていません。\nメール内のリンクをクリックしてください。"
            );
          } else {
            throw error;
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
  };

  const isCast = selectedRole === UserRole.CAST;

  if (!selectedRole) {
    return (
      <div className="login-screen login-screen-role-select">
        <div className="login-role-inner">
          <h1 className="login-app-title">{APP_NAME}</h1>
          <p className="login-app-subtitle">
            ナイトライフの新しいコミュニケーション
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

        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="login-submit-button"
        >
          {isProcessing
            ? "処理中..."
            : isRegister
            ? "アカウント作成"
            : "ログイン"}
        </button>

        {!isCast && (
          <div className="login-toggle-area">
            <div className="login-toggle-message">
              {isRegister
                ? "すでにアカウントをお持ちですか？"
                : "アカウントをお持ちでないですか？"}
            </div>
            <button
              onClick={() => setIsRegister(!isRegister)}
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
