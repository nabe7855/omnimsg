/**
 * ナビゲーションメニューの1項目を表す型
 */
export interface NavItem {
  id: string;            // 遷移先のURL
  label: string;         // 表示テキスト
  icon: React.ReactNode; // JSX.Element ではなく ReactNode を使う
}