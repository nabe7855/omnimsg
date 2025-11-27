"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ============================================
  // ★ 初回ロードで Supabase セッション復元
  // ============================================
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // 1. まずメタデータから情報を取得
        let role = session.user.user_metadata.role;
        let name = session.user.user_metadata.name;

        // 2. もしメタデータになければ、profiles テーブルを確認しに行く
        // (※ Supabaseに "profiles" テーブルがある場合のみ有効)
        if (!role) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            role = profile.role;
            name = profile.name || name;
          }
        }

        setCurrentUser({
          id: session.user.id,
          email: session.user.email!,
          name: name || "",
          role: role as UserRole, // これで role が入る
          avatar_url: session.user.user_metadata.avatar_url || "",
          display_id: session.user.user_metadata.display_id || "",
          bio: session.user.user_metadata.bio || "",
        });
      }

      setLoaded(true);
    };

    loadUser();
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

    const user = authRes.data.user;
    if (!user) return;

    setCurrentUser({
      id: user.id,
      email: user.email!,
      name: user.user_metadata.name || "",
      role: user.user_metadata.role,
      avatar_url: user.user_metadata.avatar_url || "",
      display_id: user.user_metadata.display_id || "",
      bio: user.user_metadata.bio || "",
    });

    const startPath =
      role === UserRole.STORE
        ? "/store/casts"
        : role === UserRole.USER
        ? "/home"
        : "/talks";

    router.push(startPath);
  };

  // ============================================
  // ★ ログアウト
  // ============================================
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push("/login");
  };

  return { currentUser, login, logout, loaded };
};
