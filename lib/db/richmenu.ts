import { supabase } from "@/lib/supabaseClient";
import { RichMenuItem } from "@/lib/types/richmenu";

export const getRichMenuByStore = async (
  storeId: string
): Promise<RichMenuItem[]> => {
  const { data, error } = await supabase
    .from("rich_menu_items")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ RichMenu fetch error:", error);
    return [];
  }

  return data || [];
};
