"use client";

import { Check, Clock, MessageSquare, Scale, Send, Trash2 } from "lucide-react";
import React, { useState } from "react";
import styles from "./inquiry-management.module.css";

// 定数・型のインポート（環境に合わせてパスを修正してください）
import { MOCK_INQUIRIES } from "@/adminconstants";
import { Inquiry, InquiryType, LegalStatus } from "@/lib/types";

interface LegalStatusBadgeProps {
  status: LegalStatus;
}

interface StepIndicatorProps {
  status: LegalStatus;
  step: LegalStatus;
  label: string;
}

export default function InquiryManagement() {
  const [activeTab, setActiveTab] = useState<InquiryType>(InquiryType.GENERAL);
  const [inquiries, setInquiries] = useState<Inquiry[]>(MOCK_INQUIRIES);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const filteredInquiries = inquiries.filter((i) => i.type === activeTab);

  // 送信防止措置フロー（ステートマシン簡易実装）
  const advanceLegalStatus = (id: string, currentStatus: LegalStatus) => {
    let nextStatus = currentStatus;

    if (currentStatus === LegalStatus.RECEIVED)
      nextStatus = LegalStatus.INQUIRY_SENT;
    else if (currentStatus === LegalStatus.INQUIRY_SENT)
      nextStatus = LegalStatus.AGREED_DELETE;
    else if (currentStatus === LegalStatus.AGREED_DELETE)
      nextStatus = LegalStatus.COMPLETED;

    setInquiries((prev) =>
      prev.map((i) => {
        if (i.id === id && i.legalDetails) {
          return {
            ...i,
            legalDetails: { ...i.legalDetails!, legalStatus: nextStatus },
          };
        }
        return i;
      })
    );

    // 選択中の詳細も更新
    if (selectedInquiry?.id === id && selectedInquiry.legalDetails) {
      setSelectedInquiry({
        ...selectedInquiry,
        legalDetails: {
          ...selectedInquiry.legalDetails,
          legalStatus: nextStatus,
        },
      });
    }
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          onClick={() => {
            setActiveTab(InquiryType.GENERAL);
            setSelectedInquiry(null);
          }}
          className={`${styles.tabBtn} ${
            activeTab === InquiryType.GENERAL
              ? styles.tabActiveGeneral
              : styles.tabInactive
          }`}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <MessageSquare className={styles.tabBtnIcon} />
            一般問い合わせ
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab(InquiryType.LEGAL);
            setSelectedInquiry(null);
          }}
          className={`${styles.tabBtn} ${
            activeTab === InquiryType.LEGAL
              ? styles.tabActiveLegal
              : styles.tabInactive
          }`}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Scale className={styles.tabBtnIcon} />
            送信防止措置 (プロバイダ責任制限法)
          </div>
        </button>
      </div>

      <div className={styles.contentArea}>
        {/* List Panel */}
        <div className={styles.listPanel}>
          {filteredInquiries.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedInquiry(item)}
              className={`${styles.listItem} ${
                selectedInquiry?.id === item.id ? styles.listItemSelected : ""
              }`}
            >
              <div className={styles.listItemHeader}>
                <span className={styles.listItemSubject}>{item.subject}</span>
                <span className={styles.listItemDate}>{item.createdAt}</span>
              </div>
              <p className={styles.listItemMessage}>{item.message}</p>
              {item.type === InquiryType.LEGAL && item.legalDetails && (
                <div style={{ marginTop: "0.5rem" }}>
                  <LegalStatusBadge status={item.legalDetails.legalStatus} />
                </div>
              )}
            </div>
          ))}
          {filteredInquiries.length === 0 && (
            <div className={styles.listEmpty}>該当なし</div>
          )}
        </div>

        {/* Detail Panel */}
        <div className={styles.detailPanel}>
          {selectedInquiry ? (
            <div>
              {/* Header */}
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>
                  {selectedInquiry.subject}
                </h2>
                <div className={styles.metaInfo}>
                  <span>From: {selectedInquiry.userId}</span>
                  <span>Date: {selectedInquiry.createdAt}</span>
                  <span
                    className={`${styles.statusBadge} ${
                      selectedInquiry.status === "OPEN"
                        ? styles.statusOpen
                        : styles.statusClosed
                    }`}
                  >
                    {selectedInquiry.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className={styles.messageBody}>
                {selectedInquiry.message}
              </div>

              {/* Legal Process Flow */}
              {selectedInquiry.type === InquiryType.LEGAL &&
                selectedInquiry.legalDetails && (
                  <div className={styles.legalSection}>
                    <div className={styles.legalHeader}>
                      <Scale className={styles.legalIcon} />
                      <h3 className={styles.legalTitle}>法的手続き進行管理</h3>
                    </div>

                    <div className={styles.legalContent}>
                      <div className={styles.legalInfoGrid}>
                        <div>
                          <p className={styles.infoLabel}>侵害された権利</p>
                          <p>{selectedInquiry.legalDetails.infringedRight}</p>
                        </div>
                        <div>
                          <p className={styles.infoLabel}>対象コンテンツ</p>
                          <p className={styles.contentUrl}>
                            {selectedInquiry.legalDetails.targetContentUrl}
                          </p>
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <p
                            className={styles.infoLabel}
                            style={{ marginBottom: "0.25rem" }}
                          >
                            本人確認書類
                          </p>
                          {/* Next.js Image optimization is recommended, using img for simplicity here */}
                          <img
                            src={selectedInquiry.legalDetails.identityDocUrl}
                            alt="Identity Doc"
                            className={styles.docImage}
                          />
                        </div>
                      </div>

                      {/* Progress Steps */}
                      <div className={styles.progressContainer}>
                        <div className={styles.progressLine}></div>
                        <StepIndicator
                          status={selectedInquiry.legalDetails.legalStatus}
                          step={LegalStatus.RECEIVED}
                          label="申請受領"
                        />
                        <StepIndicator
                          status={selectedInquiry.legalDetails.legalStatus}
                          step={LegalStatus.INQUIRY_SENT}
                          label="照会中(7日)"
                        />
                        <StepIndicator
                          status={selectedInquiry.legalDetails.legalStatus}
                          step={LegalStatus.AGREED_DELETE}
                          label="削除可"
                        />
                        <StepIndicator
                          status={selectedInquiry.legalDetails.legalStatus}
                          step={LegalStatus.COMPLETED}
                          label="完了"
                        />
                      </div>

                      {/* Actions */}
                      <div className={styles.actionArea}>
                        {selectedInquiry.legalDetails.legalStatus ===
                          LegalStatus.RECEIVED && (
                          <button
                            onClick={() =>
                              advanceLegalStatus(
                                selectedInquiry.id,
                                LegalStatus.RECEIVED
                              )
                            }
                            className={`${styles.actionBtn} ${styles.btnBlue}`}
                          >
                            <Send size={16} style={{ marginRight: "0.5rem" }} />
                            発信者へ照会書を送信
                          </button>
                        )}

                        {selectedInquiry.legalDetails.legalStatus ===
                          LegalStatus.INQUIRY_SENT && (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.75rem",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <span className={styles.deadlineAlert}>
                              <Clock size={12} style={{ marginRight: "4px" }} />{" "}
                              回答期限まであと5日
                            </span>
                            <button
                              onClick={() =>
                                advanceLegalStatus(
                                  selectedInquiry.id,
                                  LegalStatus.INQUIRY_SENT
                                )
                              }
                              className={`${styles.actionBtn} ${styles.btnGreen}`}
                              style={{ flex: 1 }}
                            >
                              <Check
                                size={16}
                                style={{ marginRight: "0.5rem" }}
                              />
                              同意あり/反論なしとして進める
                            </button>
                          </div>
                        )}

                        {selectedInquiry.legalDetails.legalStatus ===
                          LegalStatus.AGREED_DELETE && (
                          <button
                            onClick={() =>
                              advanceLegalStatus(
                                selectedInquiry.id,
                                LegalStatus.AGREED_DELETE
                              )
                            }
                            className={`${styles.actionBtn} ${styles.btnRed}`}
                          >
                            <Trash2
                              size={16}
                              style={{ marginRight: "0.5rem" }}
                            />
                            コンテンツを物理削除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Chat Reply Form */}
              <div className={styles.replySection}>
                <h4 className={styles.replyTitle}>返信チャット</h4>
                <div className={styles.replyForm}>
                  <textarea
                    className={styles.replyTextarea}
                    rows={3}
                    placeholder="ユーザーへ返信を入力..."
                  ></textarea>
                  <button className={styles.sendBtn}>送信</button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>リストから選択してください</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
const LegalStatusBadge: React.FC<LegalStatusBadgeProps> = ({ status }) => {
  // マッピング定義
  const badgeClassMap: Record<LegalStatus, string> = {
    [LegalStatus.RECEIVED]: styles.badgeReceived,
    [LegalStatus.INQUIRY_SENT]: styles.badgeSent,
    [LegalStatus.AGREED_DELETE]: styles.badgeAgreed,
    [LegalStatus.REFUSED_DELETE]: styles.badgeRefused,
    [LegalStatus.COMPLETED]: styles.badgeCompleted,
  };

  const labelMap: Record<LegalStatus, string> = {
    [LegalStatus.RECEIVED]: "受領済",
    [LegalStatus.INQUIRY_SENT]: "照会中 (7日待機)",
    [LegalStatus.AGREED_DELETE]: "削除待機",
    [LegalStatus.REFUSED_DELETE]: "削除拒否",
    [LegalStatus.COMPLETED]: "完了",
  };

  return (
    <span className={`${styles.legalBadge} ${badgeClassMap[status]}`}>
      {labelMap[status]}
    </span>
  );
};

const StepIndicator: React.FC<StepIndicatorProps> = ({
  status,
  step,
  label,
}) => {
  const order = [
    LegalStatus.RECEIVED,
    LegalStatus.INQUIRY_SENT,
    LegalStatus.AGREED_DELETE,
    LegalStatus.COMPLETED,
  ];
  const currentIdx = order.indexOf(status);
  const stepIdx = order.indexOf(step);

  const isCompleted = currentIdx >= stepIdx;
  const isCurrent = currentIdx === stepIdx;

  return (
    <div className={styles.stepContainer}>
      <div
        className={`${styles.stepCircle} ${
          isCompleted ? styles.stepCompleted : styles.stepPending
        }`}
      >
        {isCompleted ? <Check size={20} /> : <div className={styles.stepDot} />}
      </div>
      <span
        className={`${styles.stepLabel} ${
          isCurrent ? styles.labelActive : styles.labelInactive
        }`}
      >
        {label}
      </span>
    </div>
  );
};
