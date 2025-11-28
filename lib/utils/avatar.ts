// src/lib/utils/avatar.ts

/**
 * avatar_url が null / undefined / 空文字 の場合は
 * プレースホルダー画像にフォールバックする共通関数
 */
export const safeAvatar = (url?: string | null): string => {
  if (!url || url.trim() === "") {
    return "/placeholder-avatar.png";
  }
  return url;
};
