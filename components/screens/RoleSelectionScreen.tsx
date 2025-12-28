"use client";

import { Icons } from "@/constants.tsx";
import { UserRole } from "@/lib/types";
import React, { useState } from "react";

interface RoleSelectionScreenProps {
  onRoleSelect: (role: UserRole) => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onRoleSelect,
}) => {
  const [viewMode, setViewMode] = useState<"creator" | "user">("user");
  const isCreator = viewMode === "creator";

  const CreatorSection = () => (
    <div className="landing-hero">
      {/* Background Image with Overlay */}
      <div className="landing-hero-bg">
        <img
          src="https://images.unsplash.com/photo-1516339901600-2e1a6298ed74?q=80&w=2000&auto=format&fit=crop"
          alt="Private Space"
        />
        <div className="landing-hero-overlay" />
      </div>

      <div className="landing-hero-content">
        <div className="landing-hero-text">
          <div className="landing-badge creator">
            <Icons.Shield style={{ width: "14px", height: "14px" }} />
            Legal & Professional Platform
          </div>
          <h1 className="landing-title creator">
            SNSの
            <br />
            <span className="landing-title-accent">垢バンリスク</span>を、
            <br />
            資産に変える。
          </h1>
          <p className="landing-description creator">
            国内法に完全準拠した健全なプラットフォーム。
            <br />
            クリエイターは自身のチームメンバーに「スタッフアカウント」を発行可能。返信代行や売上管理をプロに任せ、あなたは創作に集中できます。
          </p>

          <div className="landing-cta-group">
            <button
              onClick={() => onRoleSelect(UserRole.STORE)}
              className="landing-btn landing-btn-primary"
            >
              <span className="landing-btn-text">クリエイターログイン</span>
              <span className="landing-btn-subtext">For Account Owners</span>
            </button>

            <button
              onClick={() => onRoleSelect(UserRole.CAST)}
              className="landing-btn landing-btn-secondary"
            >
              <span className="landing-btn-text">スタッフログイン</span>
              <span
                className="landing-btn-subtext"
                style={{ color: "#ddd6fe" }}
              >
                For Team Members
              </span>
            </button>
          </div>
        </div>

        {/* Floating Element */}
        <div className="landing-phone-mockup">
          <div className="landing-floating-element">
            <div className="landing-floating-bg" />
            <div className="landing-floating-card">
              <Icons.Lock
                style={{
                  width: "128px",
                  height: "128px",
                  color: "#f59e0b",
                  opacity: 0.8,
                }}
              />
              <div className="landing-floating-content">
                <div className="landing-floating-bar" />
                <div className="landing-floating-bar" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent gradient */}
      <div className="landing-bottom-accent" />
    </div>
  );

  const UserSection = () => (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div
        className="landing-hero-content"
        style={{ paddingTop: "48px", paddingBottom: "96px" }}
      >
        <div className="landing-hero-text">
          <div className="landing-badge user">
            <Icons.Shield style={{ width: "14px", height: "14px" }} />
            Identity Protected
          </div>
          <h1 className="landing-title user">
            誰にも内緒で、
            <br />
            <span className="landing-title-accent user">特別なメッセージ</span>
            を。
          </h1>
          <p className="landing-description user">
            法的ガイドラインに基づいた厳格なプライバシー保護。個人情報は最小限、通信は暗号化。安心して心を通わせましょう。
          </p>
          <div className="landing-cta-group">
            <button
              onClick={() => onRoleSelect(UserRole.USER)}
              className="landing-btn landing-btn-primary user"
            >
              チャットをはじめる
            </button>
          </div>
        </div>
        <div className="landing-phone-mockup" style={{ marginTop: "48px" }}>
          <div className="landing-phone">
            <div className="landing-phone-notch">
              <div className="landing-phone-notch-bar" />
            </div>
            <div className="landing-phone-content">
              <div className="landing-phone-bubble">
                法的基準に基づきフィルタリングされています ✅
              </div>
              <div className="landing-phone-privacy">
                <Icons.Shield
                  style={{ width: "24px", height: "24px", color: "#2563eb" }}
                />
                <p className="landing-phone-privacy-title">Privacy Locked</p>
                <p className="landing-phone-privacy-text">
                  通信は高度な暗号化により保護され、第三者による閲覧は不可能です。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main
      className={`landing-main ${isCreator ? "creator-mode" : "user-mode"}`}
    >
      {/* Mode Toggle - Segmented Control */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          gap: "0",
          background: "white",
          borderRadius: "999px",
          padding: "4px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "2px solid #e5e7eb",
        }}
      >
        <button
          onClick={() => setViewMode("user")}
          style={{
            padding: "10px 20px",
            borderRadius: "999px",
            border: "none",
            background: !isCreator ? "#f472b6" : "transparent",
            color: !isCreator ? "white" : "#6b7280",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
          }}
        >
          <span>👤</span>
          <span>一般ユーザー</span>
        </button>
        <button
          onClick={() => setViewMode("creator")}
          style={{
            padding: "10px 20px",
            borderRadius: "999px",
            border: "none",
            background: isCreator ? "#f59e0b" : "transparent",
            color: isCreator ? "#4c1d95" : "#6b7280",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
          }}
        >
          <span>🎨</span>
          <span>クリエイター</span>
        </button>
      </div>

      {isCreator ? <CreatorSection /> : <UserSection />}

      {/* Compliance Section */}
      <section
        className={`landing-compliance ${isCreator ? "creator" : "user"}`}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px" }}
        >
          <div
            className={`landing-compliance-card ${
              isCreator ? "creator" : "user"
            }`}
          >
            <div style={{ flexShrink: 0 }}>
              <div
                className={`landing-icon-circle ${
                  isCreator ? "creator" : "user"
                }`}
              >
                <Icons.Shield style={{ width: "64px", height: "64px" }} />
              </div>
            </div>
            <div className="landing-compliance-content">
              <h2
                className={`landing-section-title ${
                  isCreator ? "creator" : "user"
                }`}
              >
                信頼と安全への取り組み
              </h2>
              <div className="landing-feature-grid">
                <div className="landing-feature-item">
                  <Icons.CheckCircle
                    className={`landing-feature-icon ${
                      isCreator ? "creator" : "user"
                    }`}
                  />
                  <p
                    className={`landing-feature-text ${
                      isCreator ? "creator" : "user"
                    }`}
                  >
                    特定商取引法及び電気通信事業法に基づいた適切な運営体制
                  </p>
                </div>
                <div className="landing-feature-item">
                  <Icons.CheckCircle
                    className={`landing-feature-icon ${
                      isCreator ? "creator" : "user"
                    }`}
                  />
                  <p
                    className={`landing-feature-text ${
                      isCreator ? "creator" : "user"
                    }`}
                  >
                    24時間365日のAI及び有人監視による不適切コンテンツの遮断
                  </p>
                </div>
                <div className="landing-feature-item">
                  <Icons.CheckCircle
                    className={`landing-feature-icon ${
                      isCreator ? "creator" : "user"
                    }`}
                  />
                  <p
                    className={`landing-feature-text ${
                      isCreator ? "creator" : "user"
                    }`}
                  >
                    プライバシーマーク準拠の厳格な個人情報管理
                  </p>
                </div>
                <div className="landing-feature-item">
                  <Icons.CheckCircle
                    className={`landing-feature-icon ${
                      isCreator ? "creator" : "user"
                    }`}
                  />
                  <p
                    className={`landing-feature-text ${
                      isCreator ? "creator" : "user"
                    }`}
                  >
                    迷惑行為・スパムを防止する独自スコアリング機能
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className={`landing-features ${isCreator ? "creator" : "user"}`}>
        <div className="landing-features-header">
          <h2
            className={`landing-features-title ${
              isCreator ? "creator" : "user"
            }`}
          >
            <span
              className={`landing-features-title-accent ${
                isCreator ? "" : "user"
              }`}
            >
              cococha
            </span>
            の健全な繋がり
          </h2>
        </div>
        <div className="landing-cards-grid">
          <FeatureCard
            icon={<Icons.Shield style={{ width: "32px", height: "32px" }} />}
            title="完全なコンプライアンス"
            desc="運営の透明性を確保。すべてのやり取りが国内の法的要件を満たしており、クリエイターの社会的地位を守ります。"
            isCreator={isCreator}
          />
          <FeatureCard
            icon={<Icons.Lock style={{ width: "32px", height: "32px" }} />}
            title="プライバシー・バイ・デザイン"
            desc="開発段階からプライバシーを最優先。ユーザーが誰であるかは必要最小限しか保持せず、情報の漏洩を未然に防ぎます。"
            isCreator={isCreator}
          />
          <FeatureCard
            icon={<Icons.Alert style={{ width: "32px", height: "32px" }} />}
            title="リアルタイム監視"
            desc="不適切なやり取りは自動で検知。悪質なユーザーを排除する通報システムにより、常にクリーンな環境を提供します。"
            isCreator={isCreator}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className={`landing-footer ${isCreator ? "creator" : "user"}`}>
        <div className="landing-footer-content">
          <div className="landing-footer-brand">
            <div className="landing-footer-logo">
              <div
                className={`landing-footer-logo-icon ${
                  isCreator ? "creator" : "user"
                }`}
              >
                c
              </div>
              <span
                className={`landing-footer-logo-text ${
                  isCreator ? "creator" : "user"
                }`}
              >
                cococha
              </span>
            </div>
            <p className="landing-footer-description">
              一般社団法人セーファーチャット協会 加盟
              <br />
              電気通信事業届出番号: A-xx-xxxxx
            </p>
          </div>
          <div className="landing-footer-links">
            <div className="landing-footer-link-group">
              <p
                className={`landing-footer-link-title ${
                  isCreator ? "creator" : "user"
                }`}
              >
                法的情報
              </p>
              <a href="#" className="landing-footer-link">
                特定商取引法に基づく表記
              </a>
              <a href="#" className="landing-footer-link">
                青少年保護ガイドライン
              </a>
              <a href="#" className="landing-footer-link">
                Cookieポリシー
              </a>
            </div>
            <div className="landing-footer-link-group">
              <p
                className={`landing-footer-link-title ${
                  isCreator ? "creator" : "user"
                }`}
              >
                規約
              </p>
              <a href="#" className="landing-footer-link">
                利用規約
              </a>
              <a href="#" className="landing-footer-link">
                プライバシーポリシー
              </a>
              <a href="#" className="landing-footer-link">
                コミュニティ基準
              </a>
            </div>
          </div>
        </div>
        <div className="landing-footer-copyright">
          &copy; 2024 cococha Project. All Rights Reserved.
        </div>
      </footer>
    </main>
  );
};

const FeatureCard = ({
  icon,
  title,
  desc,
  isCreator,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  isCreator: boolean;
}) => (
  <div className={`feature-card ${isCreator ? "creator" : "user"}`}>
    <div className={`feature-card-icon ${isCreator ? "creator" : "user"}`}>
      {icon}
    </div>
    <h3 className="feature-card-title">{title}</h3>
    <p className={`feature-card-desc ${isCreator ? "creator" : "user"}`}>
      {desc}
    </p>
  </div>
);
