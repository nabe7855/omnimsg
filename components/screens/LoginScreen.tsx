"use client";

import { APP_NAME } from "@/constants";
import { supabase } from "@/lib/supabaseClient";
import { UserRole } from "@/lib/types";
import { LoginProps } from "@/lib/types/screen";
import React, { useState } from "react";

export const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegister(false);
    setEmail("");
    setPassword("");
    setName("");
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
      let supaUser = null;

      // ---------------------------
      // ① 新規登録
      // ---------------------------
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        supaUser = data.user;

        // プロフィールを作成
        if (supaUser) {
          await supabase.from("profiles").insert([
            {
              id: supaUser.id,
              email: email,
              role: selectedRole,
              name: name,
              display_id: supaUser.id.slice(0, 8),
              avatar_url: "",
              bio: "",
              store_id: null,
              business_hours: "",
            },
          ]);
        }
      }

      // ---------------------------
      // ② ログイン
      // ---------------------------
      else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        supaUser = data.user;
      }

      // ---------------------------
      // ③ ここではログイン処理はしない
      //     → onLogin は "遷移だけ" に使う
      // ---------------------------
      await onLogin(
        selectedRole,
        isRegister ? "register" : "login",
        email,
        password,
        name
      );
    } catch (err: any) {
      alert(err.message || "ログインに失敗しました");
    }

    setIsProcessing(false);
  };

  const roleLabels: Record<UserRole, string> = {
    [UserRole.USER]: "一般ユーザー",
    [UserRole.CAST]: "キャスト",
    [UserRole.STORE]: "店舗",
  };

  const isCast = selectedRole === UserRole.CAST;

  // ==========================================================
  // 🚀 ロール選択画面
  // ==========================================================
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

  // ==========================================================
  // 🚀 メール・パスワード入力画面
  // ==========================================================
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
          <div className="input-group">
            <label className="input-label">アカウント名</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
