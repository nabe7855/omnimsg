import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

// VAPIDキー (環境変数から読み込むのがベストですが、現状のコードに合わせています)
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
    // ユーザーIDがない場合は処理しない
    if (!userId) return;

    const registerAndSubscribe = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        // 1. Service Workerの登録
        await navigator.serviceWorker.register("/sw.js");

        // 2. 準備完了を待つ
        const registration = await navigator.serviceWorker.ready;

        // 3. 既存のサブスクリプションを取得 (ここで変数 sub を定義)
        let sub = await registration.pushManager.getSubscription();

        // 購読がない場合は新規登録
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // 4. DBに保存
        if (sub) {
          const { error } = await supabase.from("push_subscriptions").upsert(
            {
              user_id: userId,
              subscription: sub.toJSON(),
            },
            { onConflict: "user_id, subscription" }
          );

          if (error) {
            // アカウント削除直後などで発生する外部キー制約エラー(23503)や重複エラー(409)は無視する
            if (error.code === "409" || error.code === "23503") {
              console.warn(
                "Push subscription DB update skipped (User might be deleted)."
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
