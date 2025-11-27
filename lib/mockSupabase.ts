// src/lib/mockSupabase.ts
import { INITIAL_PROFILES, INITIAL_RICH_MENUS } from "../constants";
import {
  Message,
  MessageType,
  Profile,
  RichMenuItem,
  Room,
  UserRole,
} from "./types";

interface ProfileWithAuth extends Profile {
  password?: string;
}

/**
 * 開発用のモック Supabase 実装
 * - 認証
 * - プロフィール
 * - ルーム / グループ
 * - メッセージ
 * - 一斉送信
 * - リッチメニュー & BOT 応答
 *
 * ※ localStorage が無い環境（SSR）ではメモリ上だけで動作
 */
class MockSupabaseService {
  private profiles: ProfileWithAuth[] = [];
  private rooms: Room[] = [];
  private messages: Message[] = [];
  private richMenus: RichMenuItem[] = [];
  private currentUser: Profile | null = null;

  constructor() {
    // ここで localStorage を直接触ると SSR で落ちるので必ずガード
    this.loadFromStorageSafely();
  }

  // =========================================================
  // localStorage 読み書き（SSR セーフ）
  // =========================================================
  private hasLocalStorage(): boolean {
    try {
      // typeof localStorage でチェック（ReferenceError 回避）
      return typeof localStorage !== "undefined";
    } catch {
      return false;
    }
  }

  private loadFromStorageSafely() {
    if (!this.hasLocalStorage()) {
      // SSR / Node 側：localStorage なし → 初期データだけセット
      this.profiles = INITIAL_PROFILES.map((p) => ({
        ...p,
        password: "password",
      }));
      this.rooms = [];
      this.messages = [];
      this.richMenus = INITIAL_RICH_MENUS;
      return;
    }

    try {
      const p = localStorage.getItem("omni_profiles");
      const r = localStorage.getItem("omni_rooms");
      const m = localStorage.getItem("omni_messages");
      const rm = localStorage.getItem("omni_menus");

      if (p) {
        this.profiles = JSON.parse(p);
        // 旧データなど password がないものは補完
        this.profiles.forEach((prof) => {
          if (!prof.password) prof.password = "password";
        });
      } else {
        this.profiles = INITIAL_PROFILES.map((prof) => ({
          ...prof,
          password: "password",
        }));
        this.save("profiles");
      }

      this.rooms = r ? JSON.parse(r) : [];
      this.messages = m ? JSON.parse(m) : [];
      this.richMenus = rm ? JSON.parse(rm) : INITIAL_RICH_MENUS;
      if (!rm) this.save("richMenus");
    } catch (e) {
      console.error("Failed to load from localStorage", e);
      // 壊れたデータなどの場合も初期値で立ち上げ直す
      this.profiles = INITIAL_PROFILES.map((p) => ({
        ...p,
        password: "password",
      }));
      this.rooms = [];
      this.messages = [];
      this.richMenus = INITIAL_RICH_MENUS;
    }
  }

  private save(key: "profiles" | "rooms" | "messages" | "richMenus") {
    if (!this.hasLocalStorage()) return;

    try {
      switch (key) {
        case "profiles":
          localStorage.setItem("omni_profiles", JSON.stringify(this.profiles));
          break;
        case "rooms":
          localStorage.setItem("omni_rooms", JSON.stringify(this.rooms));
          break;
        case "messages":
          localStorage.setItem("omni_messages", JSON.stringify(this.messages));
          break;
        case "richMenus":
          localStorage.setItem("omni_menus", JSON.stringify(this.richMenus));
          break;
      }
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  // =========================================================
  // Auth
  // =========================================================

  /**
   * DEMO 用ログイン
   * - メールが存在すればそのユーザーでログイン（パスワードチェックなし）
   * - 存在しなければ即席でユーザー作成
   */
  async login(
    email: string,
    pass: string,
    requiredRole: UserRole
  ): Promise<Profile> {
    let user = this.profiles.find((p) => p.email === email);

    if (user) {
      // ロール不一致ならエラー
      if (user.role !== requiredRole) {
        throw new Error(
          `このメールアドレスは ${user.role} アカウントとして登録されています。`
        );
      }
      // デモなのでパスワードチェックはスキップ
    } else {
      // ユーザーが存在しない → デモ用に自動作成
      const namePart = email.split("@")[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      user = {
        id: crypto.randomUUID(),
        role: requiredRole,
        display_id: `user_${Math.floor(Math.random() * 100000)}`,
        name: displayName,
        email,
        password: pass,
        avatar_url: `https://picsum.photos/200/200?seed=${email}`,
        store_id: requiredRole === UserRole.CAST ? "store-1" : undefined,
        bio: "Demo Account",
      };

      this.profiles.push(user);
      this.save("profiles");
    }

    this.currentUser = user;
    return user;
  }

  async register(
    role: UserRole,
    email: string,
    pass: string,
    name: string
  ): Promise<Profile> {
    if (this.profiles.find((p) => p.email === email)) {
      throw new Error("このメールアドレスは既に使用されています。");
    }

    const user: ProfileWithAuth = {
      id: crypto.randomUUID(),
      role,
      display_id: `user_${Math.floor(Math.random() * 100000)}`,
      name,
      email,
      password: pass,
      avatar_url: `https://picsum.photos/200/200?seed=${Date.now()}`,
      store_id: role === UserRole.CAST ? "store-1" : undefined,
      bio:
        role === UserRole.CAST
          ? "お店でお待ちしています。"
          : "よろしくお願いします。",
    };

    this.profiles.push(user);
    this.save("profiles");

    this.currentUser = user;
    return user;
  }

  async logout() {
    this.currentUser = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // =========================================================
  // Profiles / People
  // =========================================================

  async getProfiles(role?: UserRole): Promise<Profile[]> {
    return role ? this.profiles.filter((p) => p.role === role) : this.profiles;
  }

  async getProfileById(id: string): Promise<Profile | undefined> {
    return this.profiles.find((p) => p.id === id);
  }

  async searchProfileByDisplayId(
    displayId: string
  ): Promise<Profile | undefined> {
    return this.profiles.find((p) => p.display_id === displayId);
  }

  async getMyCasts(storeId: string): Promise<Profile[]> {
    return this.profiles.filter(
      (p) => p.store_id === storeId && p.role === UserRole.CAST
    );
  }

  async createCast(
    storeId: string,
    name: string,
    email: string,
    pass: string
  ): Promise<Profile> {
    if (this.profiles.find((p) => p.email === email)) {
      throw new Error("このメールアドレスは既に使用されています。");
    }

    const display_id = `cast_${Date.now()}`;
    const newCast: ProfileWithAuth = {
      id: crypto.randomUUID(),
      role: UserRole.CAST,
      store_id: storeId,
      name,
      display_id,
      email,
      password: pass,
      avatar_url: `https://picsum.photos/200/200?seed=${name}`,
      bio: "お店でお待ちしています。",
    };

    this.profiles.push(newCast);
    this.save("profiles");
    return newCast;
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles = this.profiles.filter((p) => p.id !== id);
    this.save("profiles");
  }

  /**
   * 店舗がグループに追加できる「キャスト / ユーザー」一覧を返す
   * 1. 自店舗のキャスト
   * 2. 店舗と DM を持っているユーザー
   * 3. 自店舗キャストと DM を持っているユーザー
   */
  async getConnectablePeople(
    storeId: string
  ): Promise<{ casts: Profile[]; users: Profile[] }> {
    // 1. 自店舗キャスト
    const myCasts = await this.getMyCasts(storeId);
    const myCastIds = myCasts.map((c) => c.id);

    // 2. 店舗本人と DM しているユーザー
    const storeRooms = this.rooms.filter(
      (r) => r.type === "dm" && r.member_ids.includes(storeId)
    );
    const storeUserIds = storeRooms
      .map((r) => r.member_ids.find((id) => id !== storeId))
      .filter((id): id is string => !!id);

    // 3. キャストと DM しているユーザー
    const castRooms = this.rooms.filter(
      (r) =>
        r.type === "dm" && r.member_ids.some((mid) => myCastIds.includes(mid))
    );
    const castUserIds: string[] = [];
    castRooms.forEach((r) => {
      const userId = r.member_ids.find(
        (id) => !myCastIds.includes(id) && id !== storeId
      );
      if (userId) castUserIds.push(userId);
    });

    const allUserIds = Array.from(new Set([...storeUserIds, ...castUserIds]));
    const users = this.profiles.filter(
      (p) => allUserIds.includes(p.id) && p.role === UserRole.USER
    );

    return {
      casts: myCasts,
      users,
    };
  }

  // =========================================================
  // Rooms / Groups
  // =========================================================

  async getRooms(userId: string): Promise<Room[]> {
    return this.rooms
      .filter((r) => r.member_ids.includes(userId))
      .sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1));
  }

  async getRoomById(roomId: string): Promise<Room | undefined> {
    return this.rooms.find((r) => r.id === roomId);
  }

  async createRoom(userId: string, targetId: string): Promise<Room> {
    const existing = this.rooms.find(
      (r) =>
        r.type === "dm" &&
        r.member_ids.includes(userId) &&
        r.member_ids.includes(targetId)
    );
    if (existing) return existing;

    const newRoom: Room = {
      id: crypto.randomUUID(),
      type: "dm",
      member_ids: [userId, targetId],
      updated_at: new Date().toISOString(),
    };

    this.rooms.push(newRoom);
    this.save("rooms");
    return newRoom;
  }

  /**
   * グループ作成
   * - memberIds に storeId を含める（重複排除）
   * - last_message に「グループが作成されました」
   */
  async createGroupRoom(
    storeId: string,
    groupName: string,
    memberIds: string[]
  ): Promise<Room> {
    const allMembers = Array.from(new Set([storeId, ...memberIds]));

    const newGroup: Room = {
      id: crypto.randomUUID(),
      type: "group",
      group_name: groupName,
      member_ids: allMembers,
      updated_at: new Date().toISOString(),
      last_message: "グループが作成されました",
    };

    // 新しいグループはリストの先頭に
    this.rooms.unshift(newGroup);
    this.save("rooms");
    return newGroup;
  }

  async updateGroup(
    roomId: string,
    groupName: string,
    memberIds: string[]
  ): Promise<void> {
    const idx = this.rooms.findIndex((r) => r.id === roomId);
    if (idx === -1) throw new Error("Group not found");

    const room = this.rooms[idx];
    if (room.type !== "group") throw new Error("Not a group room");

    this.rooms[idx] = {
      ...room,
      group_name: groupName,
      member_ids: memberIds,
      updated_at: new Date().toISOString(),
    };

    this.save("rooms");
  }

  async deleteRoom(roomId: string): Promise<void> {
    this.rooms = this.rooms.filter((r) => r.id !== roomId);
    this.messages = this.messages.filter((m) => m.room_id !== roomId);
    this.save("rooms");
    this.save("messages");
  }

  // =========================================================
  // Messages
  // =========================================================

  async getMessages(roomId: string): Promise<Message[]> {
    return this.messages
      .filter((m) => m.room_id === roomId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }

  async sendMessage(
    senderId: string,
    roomId: string,
    content: string,
    type: MessageType = MessageType.TEXT
  ): Promise<Message> {
    const msg: Message = {
      id: crypto.randomUUID(),
      room_id: roomId,
      sender_id: senderId,
      content,
      message_type: type,
      created_at: new Date().toISOString(),
    };

    this.messages.push(msg);

    const roomIdx = this.rooms.findIndex((r) => r.id === roomId);
    if (roomIdx >= 0) {
      this.rooms[roomIdx].updated_at = new Date().toISOString();
      this.rooms[roomIdx].last_message =
        type === MessageType.TEXT ? content : "メディアが送信されました";
      this.save("rooms");
    }

    this.save("messages");
    return msg;
  }

  /**
   * 店舗 or キャストが参加しているすべてのルームに一斉送信
   */
  async sendBroadcast(senderId: string, content: string): Promise<number> {
    const relevantRooms = this.rooms.filter((r) =>
      r.member_ids.includes(senderId)
    );

    for (const room of relevantRooms) {
      await this.sendMessage(senderId, room.id, `【一斉送信】 ${content}`);
    }

    return relevantRooms.length;
  }

  // =========================================================
  // Rich Menu & Bot
  // =========================================================

  async getRichMenu(storeId: string): Promise<RichMenuItem[]> {
    return this.richMenus
      .filter((m) => m.store_id === storeId)
      .sort((a, b) => a.display_order - b.display_order);
  }

  async updateRichMenu(storeId: string, items: RichMenuItem[]): Promise<void> {
    this.richMenus = this.richMenus.filter((m) => m.store_id !== storeId);
    this.richMenus.push(...items);
    this.save("richMenus");
  }

  /**
   * ユーザーの入力テキストとリッチメニューの label が一致したら
   * BOT から自動返信を送る
   */
  async handleBotTrigger(
    roomId: string,
    storeId: string,
    triggerText: string
  ): Promise<void> {
    const menu = await this.getRichMenu(storeId);
    const match = menu.find((m) => m.label === triggerText);
    if (!match) return;

    // 疑似的なタイピング感を出すために少し遅延
    setTimeout(() => {
      this.sendMessage(
        storeId,
        roomId,
        match.response_text,
        MessageType.BOT_RESPONSE
      );
    }, 800);
  }
}

// シングルトンとして export
let _db: MockSupabaseService | null = null;
export const db: MockSupabaseService = _db ?? (_db = new MockSupabaseService());
