import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef } from "react";

// VAPIDキー
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
  
  // ★追加：最後に処理したユーザーIDを記憶しておくRef
  const processedUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // ユーザーIDがない、または「既にこのユーザーIDで処理済み」なら何もしないで終了
    if (!userId) return;
    if (processedUserIdRef.current === userId) return;

    const registerAndSubscribe = async () => {
      // 処理開始前に「処理済み」としてマーク（二重実行防止）
      processedUserIdRef.current = userId;

      if (!("serviceWorker" in navigator)) return;

      try {
        console.log("🔔 Push通知設定を開始します..."); // デバッグ用ログ

        // 1. Service Workerの登録
        // 毎回 register を呼ぶのはコストが高いので、登録済みかチェックするロジックを入れるのも手ですが
        // ブラウザ側で制御されるのでここは一旦このままで、useEffectの回数を減らすことで対策します。
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // 2. 既存のサブスクリプションを取得
        let sub = await registration.pushManager.getSubscription();

        // 3. 新規登録
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
            if (error.code === "409" || error.code === "23503") {
              // 無視してOKなエラー
            } else {
              console.error("DB upsert error:", error);
            }
          } else {
            setIsSubscribed(true);
            console.log("✅ Push通知設定完了");
          }
        }
      } catch (error) {
        console.error("Push subscription failed:", error);
        // エラーが出た場合、次回リトライできるようにフラグをリセットしてもいいが
        // 無限ループ防止のためあえてリセットしない
      }
    };

    registerAndSubscribe();
    
    // 依存配列は userId だけにする
  }, [userId]);

  return isSubscribed;
};