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
    //    これで画面を即座に表示できます
    const userId = session.user.id;
    const meta = session.user.user_metadata;

    setCurrentUser({
      id: userId,
      email: session.user.email!,
      name: meta.name || "",
      role: meta.role as UserRole,
      avatar_url: meta.avatar_url || "",
      display_id: meta.display_id || "", // メタデータになければ一旦空文字
      bio: meta.bio || "",
    });
    setLoaded(true); // ★ここで画面ロック解除！

    // 2. 裏側でDBから最新のプロフィール情報（IDや自己紹介）を取得して上書きする
    //    (roleがあってもなくても、常に最新情報を同期するのが安全です)
    console.log("Fetching latest profile from DB...");

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
          console.log("Profile sync success:", profile);

          // 取得したデータで情報を更新
          setCurrentUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              // DBにデータがあればそれを使い、なければ今のまま
              role: (profile.role as UserRole) || prev.role,
              name: profile.name || prev.name,
              display_id: profile.display_id || prev.display_id, // ★ここでIDが入る！
              bio: profile.bio || prev.bio,
              avatar_url: profile.avatar_url || prev.avatar_url,
            };
          });
        }
      });
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
