import { supabase } from "@/lib/supabaseClient";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error loading profile:", error);
    return null;
  }

  return data;
}
