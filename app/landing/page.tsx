"use client";

import React, { useState, useEffect } from "react";
import { LandingPage } from "@/components/screens/LandingPage";
import { LoginScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const { login } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [userType, setUserType] = useState<'creator' | 'user'>('user');

  // URLの状態を監視して、authモードかどうかを判定
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      setShowAuth(hash.includes('/auth'));
      if (hash.includes('creator')) setUserType('creator');
      if (hash.includes('user')) setUserType('user');
    };
    window.addEventListener('hashchange', checkHash);
    checkHash();
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // ランディングページの「はじめる」系ボタンが押された時
  const handleOpenAuth = (role: string) => {
    const type = (role === 'creator' || role === 'staff') ? 'creator' : 'user';
    window.location.hash = `#/${type}/auth`;
  };

  return (
    <main className="flex-1 flex flex-col">
      {!showAuth ? (
        /* ランディングページ */
        <div className="fade-in">
          <LandingPage 
            userType={userType} 
            onLogin={handleOpenAuth} 
          />
        </div>
      ) : (
        /* 認証・ログイン画面 */
        <div className="flex-1 flex flex-col items-center justify-center p-4 fade-in">
          <div className="w-full max-w-4xl">
            <LoginScreen onLogin={login} />
            
            <button 
              onClick={() => { window.location.hash = `#/${userType}`; }}
              className={`mt-8 text-sm font-bold opacity-60 hover:opacity-100 transition mx-auto block ${
                userType === 'creator' ? 'text-white' : 'text-gray-500'
              }`}
            >
              ← トップページに戻る
            </button>
          </div>
        </div>
      )}
    </main>
  );
}