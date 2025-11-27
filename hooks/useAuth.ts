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

  // 共通のユーザー情報取得ロジック
  const fetchAndSetUser = async (session: Session | null) => {
    // セッションがない場合はクリアして表示許可
    if (!session?.user) {
      setCurrentUser(null);
      setLoaded(true);
      return;
    }

    // 1. まず手元にある情報（メタデータ）だけで一旦ユーザー情報をセットする
    let role = session.user.user_metadata.role;
    let name = session.user.user_metadata.name;
    const userId = session.user.id;

    // ★重要：DBの結果を待たずに、まずは画面を表示させてしまう！
    setCurrentUser({
      id: userId,
      email: session.user.email!,
      name: name || "",
      role: role as UserRole, // まだ undefined かもしれないが一旦許容
      avatar_url: session.user.user_metadata.avatar_url || "",
      display_id: session.user.user_metadata.display_id || "",
      bio: session.user.user_metadata.bio || "",
    });
    setLoaded(true); // ★ここで画面ロック解除！

    // 2. もし role が欠けていたら、裏側でこっそりDBに取りに行く
    if (!role) {
      console.log("Role missing. Fetching from DB in background...");

      // 非同期でDB問い合わせ
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data: profile, error }) => {
          if (error) {
            console.error("DB Error:", error);
          }
          if (profile) {
            console.log("Role fetched from DB:", profile.role);
            // 情報が取れたら、後追いでユーザー情報を更新する
            setCurrentUser((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                role: profile.role as UserRole,
                name: profile.name || prev.name,
              };
            });
          }
        });
    }
  };

  // ============================================
  // ★ 監視リスナーを設定
  // ============================================
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
      console.log("Auth State Changed:", event);

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

  // ============================================
  // ★ ログイン / 新規登録
  // ============================================
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

      // 画面遷移
      const startPath =
        role === UserRole.STORE
          ? "/store/casts"
          : role === UserRole.USER
          ? "/home"
          : "/talks";

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
