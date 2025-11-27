"use client";

import { db } from "@/lib/mockSupabase";
import { Profile, UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false); // ★ 初期ロード完了チェック

  // ★ ページ初回ロード時にログイン状態を復元
  useEffect(() => {
    const user = db.getCurrentUser?.();
    if (user) {
      setCurrentUser(user);
    }
    setLoaded(true);
  }, []);

  const login = async (
    role: UserRole,
    mode: "login" | "register",
    email: string,
    password: string,
    name?: string
  ) => {
    let user;
    if (mode === "register") {
      user = await db.register(role, email, password, name || "");
    } else {
      user = await db.login(email, password, role);
    }

    setCurrentUser(user);

    const startPath =
      role === UserRole.STORE
        ? "/store/casts"
        : role === UserRole.USER
        ? "/home"
        : "/talks";

    router.push(startPath);
  };

  const logout = async () => {
    await db.logout();
    setCurrentUser(null);
    router.push("/login");
  };

  return { currentUser, login, logout, loaded };
};
