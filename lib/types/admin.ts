
// ユーザーの権限レベル
export enum UserRole {
  USER = 'user',
  CAST = 'cast',
  STORE = 'store',
  ADMIN = 'admin',
}

// ユーザーのアカウント状態
export enum UserStatus {
  ACTIVE = 'ACTIVE',       // 通常
  SUSPENDED = 'SUSPENDED', // 凍結（一時停止）
  BANNED = 'BANNED'        // 永久追放
}

// 通報の処理ステータス
export enum ReportStatus {
  PENDING = 'PENDING',         // 未対応
  INVESTIGATING = 'INVESTIGATING', // 調査中
  RESOLVED = 'RESOLVED',       // 処置済み
  DISMISSED = 'DISMISSED'      // 問題なし
}

// 問い合わせ種別
export enum InquiryType {
  GENERAL = 'GENERAL', // 一般問い合わせ
  LEGAL = 'LEGAL'      // 送信防止措置依頼（削除依頼）
}

// 送信防止措置（削除依頼）の法的フロー進捗
export enum LegalStatus {
  RECEIVED = 'RECEIVED',             // 申請受領
  INQUIRY_SENT = 'INQUIRY_SENT',     // 発信者へ照会中（7日間待機）
  AGREED_DELETE = 'AGREED_DELETE',   // 削除同意あり・強制削除待機
  REFUSED_DELETE = 'REFUSED_DELETE', // 削除不同意（反論あり）
  COMPLETED = 'COMPLETED'            // 手続き完了
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  registeredAt: string;
  lastLoginAt: string;
  reportCount: number; // 被通報回数
  avatarUrl: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetUserId: string;
  targetContentId?: string; // 対象のメッセージIDなど
  reason: string;
  status: ReportStatus;
  createdAt: string;
  adminMemo?: string;
  evidenceUrl?: string; // スクショなど
}

export interface Inquiry {
  id: string;
  userId: string; // 申請者
  type: InquiryType;
  subject: string;
  message: string;
  createdAt: string;
  status: 'OPEN' | 'CLOSED';
  
  // 法的対応用フィールド
  legalDetails?: {
    infringedRight: string; // 侵害された権利
    targetContentUrl: string; // 対象情報の特定
    identityDocUrl: string; // 本人確認書類
    legalStatus: LegalStatus;
    inquirySentDate?: string; // 照会メール送信日
  };
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  
  // 詳細表示用拡張フィールド
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>; // JSON詳細データ
}

// チャットルーム情報（検索用）
export interface ChatRoom {
  id: string;
  type: 'DM' | 'GROUP';
  name?: string; // グループ名（DMの場合は無し）
  memberIds: string[]; // 参加者IDリスト
  lastActiveAt: string;
}

// 監査用チャットメッセージ
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'TEXT' | 'IMAGE';
  timestamp: string;
  isDeleted?: boolean;
}