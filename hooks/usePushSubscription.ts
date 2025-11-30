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
    if (!userId) return;

    const registerAndSubscribe = async () => {
      // ブラウザがService Workerに対応しているか確認
      if (!("serviceWorker" in navigator)) return;

      try {
        // 1. Service Workerの登録
        // (注) next-pwaなどを入れている場合は自動登録されることもありますが、
        // 明示的に呼んでも問題ありません。
        await navigator.serviceWorker.register("/sw.js");

        // 2. ★重要修正★ Service Workerが「Active」になるのを確実に待つ
        // これがないと "no active Service Worker" エラーになります
        const registration = await navigator.serviceWorker.ready;

        // 3. 既に購読済みか確認
        let sub = await registration.pushManager.getSubscription();

        // 購読がない場合は新規登録
        if (!sub) {
          // ユーザーに許可を求める & 購読
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // 4. DBに保存
        // (既存の場合でも、userIdが変わっている可能性などを考慮して保存推奨)
        if (sub) {
          const { error } = await supabase.from("push_subscriptions").upsert(
            {
              user_id: userId,
              subscription: sub.toJSON(),
            },
            // subscription（JSON）全体での競合チェックは不安定な場合があるため、
            // 実際は subscription->>'endpoint' を一意キーにするのがベストですが、
            // いったん元のロジックに合わせています。
            { onConflict: "user_id, subscription" }
          );

          if (error) {
            console.error("DB upsert error:", error);
          } else {
            setIsSubscribed(true);
            console.log("Push notification setup complete!");
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
