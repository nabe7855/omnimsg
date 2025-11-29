import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

// 手順1で生成した Public Key をここに入れる
const VAPID_PUBLIC_KEY = "BHkhTie--LUg94VLJH_PFnbPQ-ate0KmThPOPfDhjz1Sdies6r_4WqQ1SaU5P6S0jqT72cqxdc7_MiiSu5RYnko";

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

    const register = async () => {
      if (!("serviceWorker" in navigator)) return;

      // 1. Service Workerの登録
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 2. 既に購読済みか確認
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        setIsSubscribed(true);
        return;
      }

      // 3. ユーザーに許可を求める & 購読
      try {
        const newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // 4. DBに保存
        await supabase.from("push_subscriptions").upsert(
          {
            user_id: userId,
            subscription: newSub.toJSON(),
          },
          { onConflict: "user_id, subscription" }
        );

        setIsSubscribed(true);
        console.log("Push notification subscribed!");
      } catch (error) {
        console.error("Push subscription failed:", error);
      }
    };

    register();
  }, [userId]);

  return isSubscribed;
};
