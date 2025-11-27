import React, { useState, useEffect } from "react";
import { UserRole } from "@/lib/types";
import { APP_NAME } from "@/constants";
import { LoginProps } from "@/lib/types/screen";

export const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [loginDone, setLoginDone] = useState(false);

  // ============================
  // ログイン完了後のフラグ（今は特に何もしない）
  // ============================
  useEffect(() => {
    if (loginDone) {
      // ここでは遷移処理は行わない想定
      // （親側の useAuth などでハンドリング）
    }
  }, [loginDone]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegister(false);
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

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

    await onLogin(
      selectedRole,
      isRegister ? "register" : "login",
      email,
      password,
      name
    );

    setIsProcessing(false);
    setLoginDone(true);
  };

  const roleLabels: Record<UserRole, string> = {
    [UserRole.USER]: "一般ユーザー",
    [UserRole.CAST]: "キャスト",
    [UserRole.STORE]: "店舗",
  };

  const isCast = selectedRole === UserRole.CAST;

  // ============================
  // 最初のロール選択画面
  // ============================
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

  // ============================
  // メール＋パスワード入力画面
  // ============================
  return (
    <div className="login-screen login-screen-form">
      <button
        onClick={handleBack}
        className="login-back-button"
        type="button"
      >
        <span className="login-back-icon">←</span>
        <span>戻る</span>
      </button>

      <h2 className="login-form-title">
        {roleLabels[selectedRole]} {isRegister ? "新規登録" : "ログイン"}
      </h2>

      <p className="login-form-description">
        {isCast
          ? "店舗から発行されたアカウントでログインしてください。"
          : isRegister
          ? "必要な情報を入力してアカウントを作成してください。"
          : "登録済みのメールアドレスとパスワードを入力してください。"}
      </p>

      <div className="login-form-fields">
        {isRegister && (
          <div className="input-group">
            <label className="input-label">アカウント名</label>
            <input
              type="text"
              className="input-field"
              placeholder="例: 山田 太郎"
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
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!isRegister && (
            <div className="login-helper-text">
              デモ用:{" "}
              {selectedRole === UserRole.USER
                ? "user@example.com"
                : selectedRole === UserRole.STORE
                ? "store@example.com"
                : "cast1@store.com"}
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">パスワード</label>
          <input
            type="password"
            className="input-field"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isRegister && (
            <div className="login-helper-text">デモ用: password</div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="login-submit-button"
          type="button"
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
              type="button"
            >
              {isRegister ? "ログイン画面へ" : "新規登録する"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
