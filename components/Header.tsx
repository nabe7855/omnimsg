import { UserType } from "@/lib/types";
import React from "react";

interface HeaderProps {
  userType: UserType;
  setUserType: (type: UserType) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userType,
  setUserType,
  isLoggedIn,
  onLogout,
}) => {
  const isCreator = userType === "creator";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        isCreator
          ? "bg-violet-950 text-white shadow-lg"
          : "bg-white/90 backdrop-blur-md text-gray-800 border-b"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className={`header-logo ${isCreator ? "header-mode-creator" : ""}`}
        >
          <div className="header-logo-icon">c</div>
          <span className="header-logo-text">cococha</span>
        </div>

        {isLoggedIn && (
          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="text-xs font-bold px-3 py-1.5 rounded-full border border-current opacity-60 hover:opacity-100 transition"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
