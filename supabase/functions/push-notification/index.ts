// 必要なライブラリのインポート
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// 環境変数からキーを取得
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
// ※通知の送信者情報として必要です（あなたのメールアドレスに変更することをお勧めします）
const VAPID_SUBJECT = "mailto:admin@example.com";

// Web Pushの設定
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Supabaseクライアントの作成（管理者権限でDB操作するためService Role Keyを使用）
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("Push Notification Function Started");

Deno.serve(async (req) => {
  try {
    // Webhookからのリクエストボディを取得
    const payload = await req.json();

    // Database Webhook は "record" というキーの中に新しいデータが入っています
    const { record } = payload;

    // データがない場合は終了
    if (!record) {
      return new Response("No record found", { status: 200 });
    }

    console.log("New message received. Room ID:", record.room_id);

    // 1. 送信相手の特定
    // room_members テーブルから、メッセージ送信者(record.sender_id)以外のメンバーを探す
    const { data: members, error: memberError } = await supabase
      .from("room_members")
      .select("profile_id")
      .eq("room_id", record.room_id)
      .neq("profile_id", record.sender_id);

    if (memberError) {
      console.error("Error fetching members:", memberError);
      return new Response("Database error", { status: 500 });
    }

    if (!members || members.length === 0) {
      console.log("No target users found.");
      return new Response("No target users", { status: 200 });
    }

    // 送信対象のユーザーIDリスト
    const targetUserIds = members.map((m) => m.profile_id);

    // 2. 相手の Push Subscription (通知の宛先情報) を取得
    const { data: subs, error: subError } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .in("user_id", targetUserIds);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response("Database error", { status: 500 });
    }

    if (!subs || subs.length === 0) {
      console.log("No subscriptions found.");
      return new Response("No subscriptions found", { status: 200 });
    }

    // 3. 通知内容の作成
    // メッセージタイプによって本文を変える
    let bodyText = record.content;
    if (record.message_type === "image") {
      bodyText = "画像が送信されました";
    } else if (record.message_type === "audio") {
      bodyText = "音声メッセージが届きました";
    }

    const notificationPayload = JSON.stringify({
      title: "新着メッセージ",
      body: bodyText,
      // 通知をクリックしたときに開くURL（チャット画面へのパス）
      url: `/talk/${record.room_id}`,
      icon: "/icon-192x192.png", // publicフォルダにあるアイコンを指定
    });

    // 4. 全端末に通知を送信
    const promises = subs.map((sub) =>
      webpush
        .sendNotification(sub.subscription, notificationPayload)
        .catch((err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // 購読が無効になっている場合（ユーザーが通知拒否した等）
            console.log("Subscription expired/invalid.");
            // 必要であればここでDBから削除する処理を追加できます
          } else {
            console.error("Web Push Error:", err);
          }
        })
    );

    await Promise.all(promises);
    console.log(`Notification sent to ${subs.length} devices.`);

    return new Response(JSON.stringify({ success: true, count: subs.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
