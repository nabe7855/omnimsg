// lib/supabaseClient.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

console.log(
  "[DEBUG-AUTH] Initializing createBrowserClient in lib/supabaseClient.ts"
);
console.log(
  "[DEBUG-AUTH] NEXT_PUBLIC_SUPABASE_URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"
);
console.log(
  "[DEBUG-AUTH] NEXT_PUBLIC_SUPABASE_ANON_KEY:",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? `✅ Set (length: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length})`
    : "❌ Missing"
);

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
