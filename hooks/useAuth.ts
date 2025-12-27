"use client";

import { supabase } from "@/lib/supabaseClient";
import { Profile, UserRole } from "@/lib/types";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

let authChangeListenerCount = 0;
let listenerInstanceId = 0; // リスナーインスタンスのID
let hookInstanceCount = 0; // useAuthフックが何回呼ばれたか
const activeListeners = new Set<number>(); // アクティブなリスナーのID

export const useAuth = () => {
  hookInstanceCount++;
  const currentHookInstance = hookInstanceCount;

  console.log(
    `[DEBUG-AUTH] 🎣 useAuth hook called #${currentHookInstance} (total active listeners: ${activeListeners.size})`
  );
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  console.log(
    `[DEBUG-AUTH] useAuth hook called (loaded=${loaded}, user=${currentUser?.id?.slice(
      0,
      5
    )})`
  );

  const fetchAndSetUser = useCallback(async (session: Session | null) => {
    console.log("[DEBUG-AUTH] ① [fetchAndSetUser] 開始");

    if (!session?.user) {
      console.log(
        "[DEBUG-AUTH] ② [fetchAndSetUser] ユーザーなし -> 完了(loaded=true)"
      );
      setCurrentUser(null);
      setLoaded(true);
      return;
    }

    const userId = session.user.id;
    console.log(
      `[DEBUG-AUTH] ② [fetchAndSetUser] ユーザーあり (ID: ${userId.slice(
        0,
        5
      )}...)`
    );

    const meta = session.user.user_metadata;

    let profileData: Profile = {
      id: userId,
      email: session.user.email!,
      name: meta.name || "",
      role: meta.role as UserRole,
      avatar_url: meta.avatar_url || "",
      display_id: meta.display_id || "",
      bio: meta.bio || "",
    };

    try {
      console.log(
        "[DEBUG-AUTH] ③ [fetchAndSetUser] DB問い合わせ開始 (profilesテーブル)"
      );

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      console.log("[DEBUG-AUTH] ④ [fetchAndSetUser] DB問い合わせ終了", {
        profile,
        error,
      });

      if (error) console.error("[DEBUG-AUTH] ❌ DB Error:", error);

      if (profile) {
        profileData = { ...profileData, ...profile };
      }
    } catch (e) {
      console.error("[DEBUG-AUTH] ❌ Fetch error:", e);
    } finally {
      console.log(
        "[DEBUG-AUTH] ⑤ [fetchAndSetUser] finallyブロック到達 -> State更新へ"
      );

      setCurrentUser((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(profileData);
        if (isSame) {
          console.log(
            "[DEBUG-AUTH] ⑥ [fetchAndSetUser] データ変更なしのためスキップ"
          );
          return prev;
        }
        console.log("[DEBUG-AUTH] ⑥ [fetchAndSetUser] データ更新実行");
        return profileData;
      });

      setLoaded(true);
      console.log("[DEBUG-AUTH] ⑦ [fetchAndSetUser] loaded = true に設定完了");
    }
  }, []);

  useEffect(() => {
    console.log("[DEBUG-AUTH] 🚀 [useEffect] 初期化開始（マウント時のみ実行）");
    let mounted = true;
    let hasInitialized = false; // 初期化フラグ

    // ユーザー情報を取得してステートに設定する関数（インライン化）
    const updateUserFromSession = async (session: Session | null) => {
      console.log("[DEBUG-AUTH] ① [updateUserFromSession] 開始");

      if (!session?.user) {
        console.log(
          "[DEBUG-AUTH] ② [updateUserFromSession] ユーザーなし -> 完了(loaded=true)"
        );
        setCurrentUser(null);
        setLoaded(true);
        return;
      }

      const userId = session.user.id;
      console.log(
        `[DEBUG-AUTH] ② [updateUserFromSession] ユーザーあり (ID: ${userId.slice(
          0,
          5
        )}...)`
      );

      const meta = session.user.user_metadata;

      let profileData: Profile = {
        id: userId,
        email: session.user.email!,
        name: meta.name || "",
        role: meta.role as UserRole,
        avatar_url: meta.avatar_url || "",
        display_id: meta.display_id || "",
        bio: meta.bio || "",
      };

      try {
        console.log(
          "[DEBUG-AUTH] ③ [updateUserFromSession] DB問い合わせ開始 (profilesテーブル)"
        );

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        console.log("[DEBUG-AUTH] ④ [updateUserFromSession] DB問い合わせ終了", {
          profile,
          error,
        });

        if (error) console.error("[DEBUG-AUTH] ❌ DB Error:", error);

        if (profile) {
          profileData = { ...profileData, ...profile };
        }
      } catch (e) {
        console.error("[DEBUG-AUTH] ❌ Fetch error:", e);
      } finally {
        console.log(
          "[DEBUG-AUTH] ⑤ [updateUserFromSession] finallyブロック到達 -> State更新へ"
        );

        setCurrentUser((prev) => {
          const isSame = JSON.stringify(prev) === JSON.stringify(profileData);
          if (isSame) {
            console.log(
              "[DEBUG-AUTH] ⑥ [updateUserFromSession] データ変更なしのためスキップ"
            );
            return prev;
          }
          console.log("[DEBUG-AUTH] ⑥ [updateUserFromSession] データ更新実行");
          return profileData;
        });

        setLoaded(true);
        console.log(
          "[DEBUG-AUTH] ⑦ [updateUserFromSession] loaded = true に設定完了"
        );
      }
    };

    // 初期セッション取得（1回のみ、タイムアウト付き）
    const initAuth = async () => {
      if (hasInitialized) {
        console.log("[DEBUG-AUTH] ⚠️ initAuth already called, skipping");
        return;
      }
      hasInitialized = true;

      try {
        console.log("[DEBUG-AUTH] 🔍 [initAuth] getSession 開始");

        // タイムアウト付きでgetSessionを実行（10秒に延長）
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("getSession timeout after 10s")),
            10000
          )
        );

        const sessionPromise = supabase.auth.getSession();

        const result = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as any;
        const {
          data: { session },
          error,
        } = result;

        console.log("[DEBUG-AUTH] 🔍 [initAuth] getSession 終了", {
          hasSession: !!session,
        });

        if (error) throw error;
        if (mounted) await updateUserFromSession(session);
      } catch (e) {
        console.error("[DEBUG-AUTH] ❌ Session check error:", e);
        if (mounted) {
          console.log("[DEBUG-AUTH] ⚠️ エラー発生のため強制的に loaded=true");
          setCurrentUser(null);
          setLoaded(true);
        }
      }
    };

    initAuth();

    // リスナーインスタンスIDを生成
    listenerInstanceId++;
    const thisListenerId = listenerInstanceId;
    activeListeners.add(thisListenerId);

    console.log(
      `[DEBUG-AUTH] 📡 Registering listener #${thisListenerId} for hook instance #${currentHookInstance} (total active: ${activeListeners.size})`
    );

    // Auth状態変化の監視（同期的に処理）
    const eventHistory: Array<{ event: string; timestamp: number }> = [];

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      authChangeListenerCount++;
      const now = Date.now();
      eventHistory.push({ event, timestamp: now });

      // 直近10イベントの時間差を計算
      const recentEvents = eventHistory.slice(-10);
      const timeSinceFirst =
        recentEvents.length > 1 ? now - recentEvents[0].timestamp : 0;

      console.log(
        `[DEBUG-AUTH] 🔔 [Listener #${thisListenerId}] onAuthStateChange #${authChangeListenerCount} | Event: ${event} | Session: ${!!session} | Time since first: ${timeSinceFirst}ms`
      );

      // イベント履歴を表示（最新5件）
      if (eventHistory.length > 1) {
        const recent5 = eventHistory
          .slice(-5)
          .map((e) => e.event)
          .join(" → ");
        console.log(`[DEBUG-AUTH] 📊 Recent event chain: ${recent5}`);
      }

      if (authChangeListenerCount > 20) {
        console.warn(
          `[DEBUG-AUTH] ⚠️ 警告: onAuthStateChange が異常な回数(${authChangeListenerCount})呼ばれています。`
        );
        console.warn(
          `[DEBUG-AUTH] ⚠️ Active listeners: ${activeListeners.size}, This listener: #${thisListenerId}`
        );
        console.warn(
          `[DEBUG-AUTH] ⚠️ Event history (last 10):`,
          eventHistory.slice(-10).map((e) => `${e.event}@${e.timestamp}`)
        );
      }

      if (!mounted) {
        console.log(
          `[DEBUG-AUTH] 🔔 [Listener #${thisListenerId}] Unmounted, skipping...`
        );
        return;
      }

      // INITIAL_SESSIONは初回のgetSessionで処理済みなのでスキップ
      if (event === "INITIAL_SESSION") {
        console.log(
          `[DEBUG-AUTH] 🔔 [Listener #${thisListenerId}] INITIAL_SESSION - スキップ（initAuthで処理済み）`
        );
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log(
          `[DEBUG-AUTH] 🔔 [Listener #${thisListenerId}] ${event} detected - updating user`
        );
        // 非同期処理を同期的に開始（awaitしない）
        updateUserFromSession(session).catch((err) => {
          console.error(
            `[DEBUG-AUTH] ❌ [Listener #${thisListenerId}] onAuthStateChange内のupdateUserFromSessionエラー:`,
            err
          );
        });
      } else if (event === "SIGNED_OUT") {
        console.log(
          `[DEBUG-AUTH] 👋 [Listener #${thisListenerId}] サインアウト検知`
        );
        setCurrentUser(null);
        setLoaded(true);
      } else {
        console.log(
          `[DEBUG-AUTH] ℹ️ [Listener #${thisListenerId}] Unhandled event: ${event} - ignoring`
        );
      }
    });

    return () => {
      console.log(
        `[DEBUG-AUTH] 🧹 [Hook #${currentHookInstance}] クリーンアップ実行 - Unsubscribing listener #${thisListenerId}`
      );
      activeListeners.delete(thisListenerId);
      console.log(
        `[DEBUG-AUTH] 🧹 Remaining active listeners: ${activeListeners.size}`
      );
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // 依存配列を空にして、マウント時のみ実行

  const login = useCallback(
    async (
      role: UserRole,
      mode: "login" | "register",
      email: string,
      password: string,
      name?: string
    ) => {
      console.log(`🔑 [login] 実行: mode=${mode}, role=${role}`);
      try {
        let authRes;
        if (mode === "register") {
          authRes = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, role } },
          });
        } else {
          authRes = await supabase.auth.signInWithPassword({ email, password });
        }

        if (authRes.error) {
          console.error("❌ Login failed:", authRes.error.message);
          alert(authRes.error.message);
          return;
        }

        console.log("✅ Login success, redirecting...");
        const startPath = role === UserRole.STORE ? "/store/casts" : "/home";
        router.push(startPath);
      } catch (error) {
        console.error("❌ Login error:", error);
        alert("エラーが発生しました");
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    console.log("🚪 [logout] 実行");
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push("/login");
  }, [router]);

  return { currentUser, login, logout, loaded };
};
