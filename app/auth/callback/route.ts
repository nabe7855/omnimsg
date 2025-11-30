import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 認証後にリダイレクトしたい先（通常はホーム）
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // コードをセッションに交換
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 成功したらログイン済みとしてホームへ
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // エラー等の場合はログイン画面に戻す
  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}