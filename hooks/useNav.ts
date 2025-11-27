// hooks/useNav.ts
"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const useNav = () => {
  const router = useRouter();

  // path が number (戻る用) のケースも安全に処理
  const navigate = useCallback(
    (path: string | number) => {
      queueMicrotask(() => {
        if (typeof path === "number") {
          router.back();
        } else {
          router.push(path);
        }
      });
    },
    [router]
  );

  return navigate;
};
