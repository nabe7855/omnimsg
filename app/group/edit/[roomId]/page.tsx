"use client";

import { GroupManageScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/hooks/useNav";

export default function Page({ params }: { params?: { id?: string } }) {
  const navigate = useNav();
  const { currentUser } = useAuth();

  return (
    <GroupManageScreen
      currentUser={currentUser}
      navigate={navigate}
      roomId={params?.id}
    />
  );
}
