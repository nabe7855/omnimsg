import { supabase } from "@/lib/supabaseClient";

// ---------------------------
// 新規登録
// ---------------------------
export async function registerUser(
  role: string,
  email: string,
  password: string,
  name: string
) {
  // Supabase Auth でユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // profiles に追加
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user?.id,
    role,
    name,
    email,
    display_id: crypto.randomUUID().slice(0, 8),
  });

  if (profileError) throw profileError;

  return authData.user;
}

// ---------------------------
// ログイン
// ---------------------------
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  return data.user;
}

// ---------------------------
// ログアウト
// ---------------------------
export async function logoutUser() {
  await supabase.auth.signOut();
}
