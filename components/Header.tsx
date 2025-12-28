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
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl ${
              isCreator
                ? "bg-amber-500 text-violet-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                : "bg-pink-400 text-white"
            }`}
          >
            c
          </div>
          <span className="text-xl font-black tracking-tighter">cococha</span>
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
