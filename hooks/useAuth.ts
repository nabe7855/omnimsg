"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchAndSetUser = async (session: Session | null) => {
    // セッションがない場合
    if (!session?.user) {
      setCurrentUser(null);
      setLoaded(true);
      return;
    }

    const userId = session.user.id;
    const meta = session.user.user_metadata;

    // 1. ベースの情報をセット（Auth情報から仮作成）
    // ※ ここに agreed_to_terms_at などが含まれていないのがバグの元でした
    let profileData: Profile = {
      id: userId,
      email: session.user.email!,
      name: meta.name || "",
      role: meta.role as UserRole,
      avatar_url: meta.avatar_url || "",
      display_id: meta.display_id || "",
      bio: meta.bio || "",
      // 型定義(Profile)に存在するオプショナルなプロパティも初期化しておくと安全ですが、
      // 下記のDB同期で上書きされるため、ここでは最低限でOK
    };

    // console.log("Fetching latest profile from DB...");

    try {
      // 2. DBから最新情報を取得
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("DB Error:", error);
      }

      if (profile) {
        // console.log("Profile sync success:", profile);

        // ★修正ポイント:
        // 手動でプロパティを指定するのではなく、DBから取れた profile の中身を
        // 全てスプレッド構文 (...profile) で上書きします。
        // これにより agreed_to_terms_at や store_id 等も確実に state に入ります。
        profileData = {
          ...profileData,
          ...profile, // ← これでDBの全カラムが反映されます
        };
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      // 3. 全てのデータ取得が終わってから State を更新し、ロード完了とする
      setCurrentUser(profileData);
      setLoaded(true);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // セキュリティ警告回避のため getUser を推奨しますが、
        // 既存ロジックを維持しつつ安全にチェックします
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          await fetchAndSetUser(session);
        }
      } catch (e) {
        console.error("Session check error:", e);
        if (mounted) setLoaded(true);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await fetchAndSetUser(session);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setLoaded(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    role: UserRole,
    mode: "login" | "register",
    email: string,
    password: string,
    name?: string
  ) => {
    try {
      let authRes;

      if (mode === "register") {
        authRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
          },
        });
      } else {
        authRes = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (authRes.error) {
        alert(authRes.error.message);
        return;
      }

      // ログイン成功時のリダイレクト先
      const startPath =
        role === UserRole.STORE
          ? "/store/casts"
          : role === UserRole.USER
          ? "/home"
          : "/home"; // キャストもhomeへ

      router.push(startPath);
    } catch (error) {
      console.error("Login error:", error);
      alert("エラーが発生しました");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push("/login");
  };

  return { currentUser, login, logout, loaded };
};
