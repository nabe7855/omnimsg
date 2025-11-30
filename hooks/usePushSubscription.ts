import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

// 手順1で生成した Public Key をここに入れる
const VAPID_PUBLIC_KEY =
  "BHkhTie--LUg94VLJH_PFnbPQ-ate0KmThPOPfDhjz1Sdies6r_4WqQ1SaU5P6S0jqT72cqxdc7_MiiSu5RYnko";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const usePushSubscription = (userId: string | undefined) => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // ユーザーIDがない、または削除直後の場合は何もしない
    if (!userId) return;

    const registerAndSubscribe = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        // ... (Service Worker登録などの処理) ...

        // 4. DBに保存部分の修正
        if (sub) {
          const { error } = await supabase.from("push_subscriptions").upsert(
            {
              user_id: userId,
              subscription: sub.toJSON(),
            },
            { onConflict: "user_id, subscription" }
          );

          if (error) {
            // ★修正: 409エラーやユーザー不在エラーは無視する
            // アカウント削除直後にこの処理が走るとエラーになるため
            if (error.code === "409" || error.code === "23503") {
              console.warn(
                "Push subscription conflict ignored (user might be deleted)."
              );
            } else {
              console.error("DB upsert error:", error);
            }
          } else {
            setIsSubscribed(true);
          }
        }
      } catch (error) {
        console.error("Push subscription failed:", error);
      }
    };

    registerAndSubscribe();
  }, [userId]);

  return isSubscribed;
};
