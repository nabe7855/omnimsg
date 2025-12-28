
import React from 'react';
import { UserType } from '@/lib/types';

interface HeaderProps {
  userType: UserType;
  setUserType: (type: UserType) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userType, setUserType, isLoggedIn, onLogout }) => {
  const isCreator = userType === 'creator';
  
  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${isCreator ? 'bg-violet-950 text-white shadow-lg' : 'bg-white/90 backdrop-blur-md text-gray-800 border-b'}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => !isLoggedIn && setUserType(isCreator ? 'creator' : 'user')}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl transform transition-transform group-hover:scale-110 ${isCreator ? 'bg-amber-500 text-violet-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-pink-400 text-white'}`}>c</div>
          <span className="text-xl font-black tracking-tighter">cococha</span>
        </div>

        {!isLoggedIn ? (
          <div className="flex items-center bg-gray-100/10 p-1 rounded-full border border-white/10 sm:bg-gray-100 sm:border-gray-200">
            <div className="relative flex items-center p-0.5 bg-gray-200/20 sm:bg-gray-200 rounded-full">
              <button
                onClick={() => setUserType('creator')}
                className={`relative z-10 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 ${isCreator ? 'text-white' : 'text-gray-500'}`}
              >
                クリエイター
              </button>
              <button
                onClick={() => setUserType('user')}
                className={`relative z-10 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 ${!isCreator ? 'text-white' : 'text-gray-500'}`}
              >
                一般
              </button>
              <div 
                className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-300 ease-out ${isCreator ? 'left-0.5 bg-violet-800' : 'left-[calc(50%)] bg-pink-400'}`}
              />
            </div>
          </div>
        ) : (
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
