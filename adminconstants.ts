import {
  AuditLog,
  ChatMessage,
  ChatRoom,
  Inquiry,
  InquiryType,
  LegalStatus,
  Report,
  ReportStatus,
  User,
  UserRole,
  UserStatus,
} from "./lib/types";

// モックユーザーデータ (内訳表示テスト用に増量)
export const MOCK_USERS: User[] = [
  {
    id: "u001",
    name: "田中 太郎",
    email: "tanaka@example.com",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    registeredAt: "2023-10-01",
    lastLoginAt: "2023-10-25 14:00",
    reportCount: 0,
    avatarUrl: "https://picsum.photos/200/200?random=1",
  },
  {
    id: "u002",
    name: "悪質 業者",
    email: "spam@bad-company.com",
    role: UserRole.STORE,
    status: UserStatus.SUSPENDED,
    registeredAt: "2023-10-20",
    lastLoginAt: "2023-10-24 09:30",
    reportCount: 15,
    avatarUrl: "https://picsum.photos/200/200?random=2",
  },
  {
    id: "u003",
    name: "鈴木 花子",
    email: "suzuki@example.com",
    role: UserRole.CAST,
    status: UserStatus.ACTIVE,
    registeredAt: "2023-09-15",
    lastLoginAt: "2023-10-25 10:00",
    reportCount: 1,
    avatarUrl: "https://picsum.photos/200/200?random=3",
  },
  {
    id: "u004",
    name: "佐藤 健",
    email: "sato@example.com",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    registeredAt: "2023-10-05",
    lastLoginAt: "2023-10-26 08:00",
    reportCount: 0,
    avatarUrl: "https://picsum.photos/200/200?random=4",
  },
  {
    id: "u005",
    name: "Club Alice",
    email: "alice@store.com",
    role: UserRole.STORE,
    status: UserStatus.ACTIVE,
    registeredAt: "2023-08-20",
    lastLoginAt: "2023-10-26 18:00",
    reportCount: 0,
    avatarUrl: "https://picsum.photos/200/200?random=5",
  },
  {
    id: "u006",
    name: "姫川 あゆみ",
    email: "ayumi@cast.com",
    role: UserRole.CAST,
    status: UserStatus.ACTIVE,
    registeredAt: "2023-10-10",
    lastLoginAt: "2023-10-26 21:00",
    reportCount: 2,
    avatarUrl: "https://picsum.photos/200/200?random=6",
  },
];

// モック通報データ
export const MOCK_REPORTS: Report[] = [
  {
    id: "r001",
    reporterId: "u003",
    targetUserId: "u002",
    reason: "執拗な勧誘メッセージが送られてくる",
    status: ReportStatus.PENDING,
    createdAt: "2023-10-25 10:30",
    evidenceUrl: "https://picsum.photos/600/400?random=10",
  },
  {
    id: "r002",
    reporterId: "u001",
    targetUserId: "u002",
    reason: "詐欺サイトへの誘導リンク",
    status: ReportStatus.INVESTIGATING,
    createdAt: "2023-10-24 15:20",
    adminMemo: "URLを確認中。ブラックリスト照合待ち。",
  },
];

// モック問い合わせデータ（一般・法的）
export const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "iq001",
    userId: "u001",
    type: InquiryType.GENERAL,
    subject: "パスワード変更について",
    message: "設定画面からパスワードが変更できません。手順を教えてください。",
    createdAt: "2023-10-25 09:00",
    status: "OPEN",
  },
  {
    id: "iq002",
    userId: "u003",
    type: InquiryType.LEGAL,
    subject: "著作権侵害による画像削除依頼",
    message:
      "私の撮影した写真が無断でプロフィールに使用されています。プロバイダ責任制限法に基づき削除を求めます。",
    createdAt: "2023-10-23 11:00",
    status: "OPEN",
    legalDetails: {
      infringedRight: "著作権（複製権・公衆送信権）",
      targetContentUrl: "/users/u002/gallery/img_1234",
      identityDocUrl: "https://picsum.photos/400/300?random=20", // 免許証等のモック
      legalStatus: LegalStatus.INQUIRY_SENT,
      inquirySentDate: "2023-10-23", // 7日間のカウントダウン用
    },
  },
];

// モック操作ログ (詳細情報を追加)
export const MOCK_LOGS: AuditLog[] = [
  {
    id: "l001",
    adminName: "Admin-01",
    action: "VIEW_LOG",
    target: "ChatRoom-777 (Reported)",
    timestamp: "2023-10-25 14:05:00",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    metadata: {
      reason: "User report investigation",
      accessedFields: ["message_history", "image_logs"],
      durationMs: 450,
    },
  },
  {
    id: "l002",
    adminName: "Admin-02",
    action: "USER_SUSPEND",
    target: "u002",
    timestamp: "2023-10-24 16:00:00",
    ipAddress: "10.0.0.5",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    metadata: {
      previousStatus: "ACTIVE",
      newStatus: "SUSPENDED",
      adminNote: "Confirmed spam activity via multiple reports.",
    },
  },
  {
    id: "l003",
    adminName: "System_Bot",
    action: "AUTO_BAN",
    target: "u999",
    timestamp: "2023-10-24 04:22:10",
    ipAddress: "127.0.0.1",
    userAgent: "Server-Side-Job/1.0",
    metadata: {
      trigger: "Fraud detection heuristic #442",
      confidenceScore: 0.98,
      blacklistedIpMatch: true,
    },
  },
  {
    id: "l004",
    adminName: "Admin-01",
    action: "EXPORT_CSV",
    target: "UserList_202310.csv",
    timestamp: "2023-10-23 09:15:30",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    metadata: {
      rowCount: 1450,
      filterQuery: "role=STORE",
      approvedBy: "Chief_Admin",
    },
  },
];

// モックチャットルーム（検索テスト用）
export const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: "room_suspicious",
    type: "DM",
    memberIds: ["u002", "u003"],
    lastActiveAt: "2023-10-24 10:06:30",
  },
  {
    id: "room_group_A",
    type: "GROUP",
    name: "高収入バイト紹介G",
    memberIds: ["u002", "u005", "u001"],
    lastActiveAt: "2023-10-24 12:00:00",
  },
  {
    id: "room_group_B",
    type: "GROUP",
    name: "週末イベント打ち合わせ",
    memberIds: ["u003", "u005", "u006"],
    lastActiveAt: "2023-10-25 09:00:00",
  },
  {
    id: "room_dm_normal",
    type: "DM",
    memberIds: ["u001", "u004"],
    lastActiveAt: "2023-10-20 18:30:00",
  },
];

// モックチャットログ (特定のルームIDでのみ表示)
export const MOCK_CHAT_LOGS: ChatMessage[] = [
  // room_suspicious (DM: 業者 vs キャスト)
  {
    id: "m001",
    roomId: "room_suspicious",
    senderId: "u002",
    senderName: "悪質 業者",
    content: "初めまして！高収入バイトに興味ありませんか？",
    type: "TEXT",
    timestamp: "2023-10-24 10:00:00",
  },
  {
    id: "m002",
    roomId: "room_suspicious",
    senderId: "u003",
    senderName: "鈴木 花子",
    content: "興味ないです。スパム報告しますね。",
    type: "TEXT",
    timestamp: "2023-10-24 10:05:00",
  },
  {
    id: "m003",
    roomId: "room_suspicious",
    senderId: "u002",
    senderName: "悪質 業者",
    content: "待ち合わせ場所の詳細はLINEで送ります。ID: scam1234",
    type: "TEXT",
    timestamp: "2023-10-24 10:06:00",
  },
  {
    id: "m004",
    roomId: "room_suspicious",
    senderId: "u002",
    senderName: "悪質 業者",
    content: "https://picsum.photos/400/300?random=99", // 誘導画像
    type: "IMAGE",
    timestamp: "2023-10-24 10:06:30",
  },

  // room_group_A (Group: 業者, 店舗, 一般)
  {
    id: "g001",
    roomId: "room_group_A",
    senderId: "u002",
    senderName: "悪質 業者",
    content: "このグループ限定で特別な案件を紹介します！",
    type: "TEXT",
    timestamp: "2023-10-24 11:55:00",
  },
  {
    id: "g002",
    roomId: "room_group_A",
    senderId: "u001",
    senderName: "田中 太郎",
    content: "これなんのグループですか？",
    type: "TEXT",
    timestamp: "2023-10-24 11:58:00",
  },
];

// ナビゲーションメニュー
export const NAV_ITEMS = [
  { id: "dashboard", label: "ダッシュボード", icon: "LayoutDashboard" },
  { id: "users", label: "ユーザー管理", icon: "Users" },
  { id: "reports", label: "通報管理", icon: "AlertTriangle" },
  { id: "inquiries", label: "法務・問合せ", icon: "Scale" },
  { id: "logs", label: "監査ログ", icon: "FileText" },
];

// グラフ用データ生成ヘルパー
export const generateChartData = (days: number) => {
  const data = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

    // ランダムな数値を生成（デモ用）
    data.push({
      name: dateStr,
      user: Math.floor(Math.random() * 15) + 5, // 一般
      cast: Math.floor(Math.random() * 8) + 1, // キャスト
      store: Math.floor(Math.random() * 3), // 店舗
      reports: Math.floor(Math.random() * 5), // 通報数
    });
  }
  return data;
};

// 初期表示用（90日分）
export const MOCK_CHART_DATA = generateChartData(90);
