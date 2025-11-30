import { getConnectablePeople } from "@/lib/db/group";
import { supabase } from "@/lib/supabaseClient";
import { Profile, RoomWithPartner } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export const useChatRoom = (
  roomId: string,
  currentUser: Profile | null,
  navigate: (path: string) => void
) => {
  const [currentRoom, setCurrentRoom] = useState<RoomWithPartner | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [addCandidates, setAddCandidates] = useState<Profile[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  useEffect(() => {
    const loadRoomAndMembers = async () => {
      if (!currentUser || !roomId) return;
      setIsLoading(true);

      try {
        const { data: room, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (error || !room) {
          alert("チャットルームが存在しません");
          navigate("/talks");
          return;
        }

        const { data: participants } = await supabase
          .from("room_participants")
          .select("user_id")
          .eq("room_id", roomId);

        const { data: members } = await supabase
          .from("room_members")
          .select("profile_id")
          .eq("room_id", roomId);

        const pIds = participants ? participants.map((p) => p.user_id) : [];
        const mIds = members ? members.map((m) => m.profile_id) : [];
        const allMemberIds = Array.from(new Set([...pIds, ...mIds]));

        if (allMemberIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", allMemberIds);
          if (profiles) setMemberProfiles(profiles);
        }

        let partner: Profile | undefined = undefined;
        if (room.type === "dm") {
          const partnerId = allMemberIds.find((id) => id !== currentUser.id);
          if (partnerId) {
            const { data: pData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", partnerId)
              .single();
            if (pData) partner = pData;
          }
        }

        setCurrentRoom({
          ...room,
          partner,
          member_ids: allMemberIds,
        });
      } catch (e) {
        console.error("ルーム読み込みエラー:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoomAndMembers();
  }, [roomId, currentUser, navigate]);

  const fetchAddCandidates = useCallback(async () => {
    if (!currentUser || !currentRoom) return;
    setIsLoadingCandidates(true);
    try {
      const { casts, usersByCast } = await getConnectablePeople(currentUser.id);
      const candidatesMap = new Map<string, Profile>();

      casts.forEach((cast) => candidatesMap.set(cast.id, cast));
      Object.values(usersByCast).forEach((userList) => {
        userList.forEach((user) => candidatesMap.set(user.id, user));
      });

      currentRoom.member_ids.forEach((id) => candidatesMap.delete(id));
      setAddCandidates(Array.from(candidatesMap.values()));
    } catch (e) {
      console.error("候補取得エラー:", e);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [currentUser, currentRoom]);

  const addMember = async (targetProfile: Profile) => {
    try {
      const { error } = await supabase.from("room_members").insert({
        room_id: roomId,
        profile_id: targetProfile.id,
      });
      if (error) throw error;

      alert(`${targetProfile.name}さんを追加しました`);
      setMemberProfiles((prev) => [...prev, targetProfile]);
      setCurrentRoom((prev) =>
        prev
          ? { ...prev, member_ids: [...prev.member_ids, targetProfile.id] }
          : null
      );
      setAddCandidates((prev) => prev.filter((p) => p.id !== targetProfile.id));
    } catch (e) {
      console.error("追加エラー:", e);
      alert("追加に失敗しました");
    }
  };

  const removeMember = async (targetId: string) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("profile_id", targetId);

      if (error) throw error;
      setMemberProfiles((prev) => prev.filter((p) => p.id !== targetId));
      setCurrentRoom((prev) =>
        prev
          ? {
              ...prev,
              member_ids: prev.member_ids.filter((id) => id !== targetId),
            }
          : null
      );
    } catch (e) {
      console.error("削除エラー:", e);
      alert("削除に失敗しました");
    }
  };

  return {
    currentRoom,
    memberProfiles,
    isLoading,
    addCandidates,
    isLoadingCandidates,
    fetchAddCandidates,
    addMember,
    removeMember,
  };
};
