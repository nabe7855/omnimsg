"use client";

import { GroupManageScreen } from "@/components/screens/Screens";
import { useNav } from "@/hooks/useNav";
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const navigate = useNav();
  const { currentUser } = useAuth();

  return (
    <GroupManageScreen
      currentUser={currentUser}
      navigate={navigate}
      roomId={undefined} // ❗明示的に渡す（optional）
    />
  );
}
