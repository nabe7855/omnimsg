"use client";

import { BroadcastScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page() {
  const navigate = useNav();
  const { currentUser } = useAuth();

  return <BroadcastScreen currentUser={currentUser} navigate={navigate} />;
}
