"use client";

import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, CheckCircle, Lock, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import styles from "./login.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        throw new Error(authError.message);
      }

      // 権限チェック (管理者かどうか)
      // ※profilesテーブルにroleカラムがある前提
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role !== "admin") {
          // 管理者でない場合はログアウトさせてエラー表示
          await supabase.auth.signOut();
          throw new Error("管理者権限がありません。");
        }

        // 成功したらダッシュボードへ
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました。");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerOverlay}></div>
          <div className={styles.headerContent}>
            <div className={styles.logoCircle}>
              <Shield className={styles.logoIcon} />
            </div>
            <h1 className={styles.appTitle}>Legal Safety</h1>
            <p className={styles.appSubtitle}>Control Center Admin Panel</p>
          </div>
        </div>

        {/* Form Body */}
        <div className={styles.body}>
          <form onSubmit={handleSubmit}>
            <div className={styles.demoNotice}>
              <CheckCircle className={styles.checkIcon} />
              <p>
                管理者アカウントでログインしてください。
                <br />
                操作ログは全て記録されます。
              </p>
            </div>

            <div className={styles.formGroup}>
              <div>
                <label className={styles.label}>Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} />
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <div>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} />
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? (
                <span className={styles.btnContent}>
                  <div className={styles.spinner}></div>
                  Authenticating...
                </span>
              ) : (
                <span className={styles.btnContent}>
                  Sign In to Console
                  <ArrowRight className={styles.btnIcon} />
                </span>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Authorized personnel only. All access is logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
