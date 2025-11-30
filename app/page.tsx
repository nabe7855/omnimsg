"use client";

import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";
import { useEffect } from "react";

export default function Page() {
  const navigate = useNav();
  const { currentUser, loaded } = useAuth();

  useEffect(() => {
    // ローディング中はまだ判断しない
    if (!loaded) return;

    if (!currentUser) {
      // 未ログインならログイン画面へ
      navigate("/login");
    } else {
      // ★ ログイン済みなら /home へ転送
      navigate("/home");
    }
  }, [currentUser, loaded, navigate]);

  // リダイレクト用ページなので何も描画しない（またはローディング表示）
  return null;
}
