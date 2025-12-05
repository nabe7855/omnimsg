// src/api/delete-account/route.ts
// ▼▼▼ 修正: 正しくは "@supabase/ssr" です ("supabase-" は不要) ▼▼▼
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
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
      data: { session },
    } = await supabaseUser.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id; // 操作者のID（店舗）

    let targetUserId = currentUserId; // デフォルトは自分自身(退会機能用)

    try {
      // ボディがあれば読み取る
      const body = await request.json();
      if (body.target_id) {
        // 他人を削除しようとしている場合
        const requestTargetId = body.target_id;

        // ★重要: セキュリティチェック
        // 「本当に自分の店舗のキャストか？」を管理者権限で確認する
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: targetProfile } = await supabaseAdmin
          .from("profiles")
          .select("store_id, role")
          .eq("id", requestTargetId)
          .single();

        // 対象が存在しない、または店舗IDが一致しない場合はエラー
        if (!targetProfile || targetProfile.store_id !== currentUserId) {
          return NextResponse.json(
            { error: "Forbidden: You can only delete your own casts." },
            { status: 403 }
          );
        }

        // チェックOKならターゲットを書き換える
        targetUserId = requestTargetId;
      }
    } catch (e) {
      // JSONのパースエラー等は無視（ボディなし＝自分削除とみなす）
    }

    // 2. 管理者権限で Supabase クライアントを作成 (削除実行用)
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

    // 3. プロフィール削除 (明示的に行う場合)
    await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);

    // 4. Authユーザー削除実行
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (error) {
      console.error("Delete user error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
