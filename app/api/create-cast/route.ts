import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // 1. 操作しているユーザー（店舗）を確認
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storeId = user.id; // 店舗ID

    // 2. リクエストボディの取得
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // 3. 管理者権限クライアントの作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. キャストアカウントの作成（admin.createUserを使用）
    // ★ email_confirm: true にすることで、メール認証リンクを踏まずに即ログイン可能にします
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 即時有効化
        user_metadata: {
          name: name,
          role: "cast",
          store_id: storeId,
        },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUser = authData.user;
    if (!newUser) {
      return NextResponse.json(
        { error: "ユーザー作成に失敗しました" },
        { status: 500 }
      );
    }

    // 5. プロフィールの作成・更新
    const displayId = newUser.id.slice(0, 8);

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert([
        {
          id: newUser.id,
          email: email,
          role: "cast",
          name: name,
          display_id: displayId,
          store_id: storeId,
          avatar_url: "",
          bio: "",
          // 即時有効化に伴い、規約同意日時などはNULLのまま（初回ログイン時に同意させる）
        },
      ]);

    if (profileError) {
      console.error("Profile Error:", profileError);
      // 万が一プロフィール作成に失敗したらAuthユーザーも消すなどのロールバック処理があると理想的ですが、
      // ここではエラーを返します
      return NextResponse.json(
        {
          error: "プロフィールの作成に失敗しました",
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
