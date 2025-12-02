"use client";

import {
  AlertTriangle,
  // BrainCircuit, // ★AI関連アイコン
  CheckCircle,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import styles from "./report-management.module.css";

// 定数・型・サービスのインポート（環境に合わせてパスを修正してください）
import { MOCK_REPORTS } from "@/adminconstants";
import { Report, ReportStatus } from "@/lib/types";
//import { analyzeReportRisk } from "@/services/geminiService";

interface StatusBadgeProps {
  status: ReportStatus;
}

export default function ReportManagement() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // ★AI関連のStateをコメントアウト
  // const [aiAnalysis, setAiAnalysis] = useState<string>("");
  // const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ステータス更新
  const updateStatus = (id: string, status: ReportStatus) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selectedReport?.id === id) {
      setSelectedReport((prev) => (prev ? { ...prev, status } : null));
    }
  };

  // ★AI分析ハンドラーをコメントアウト
  /*
  const handleAiAnalyze = async (report: Report) => {
    setIsAnalyzing(true);
    setAiAnalysis("");

    // Geminiサービスの呼び出し（実際にはAPIキーが必要）
    // src/services/geminiService.ts が実装されている前提
    try {
      const result = await analyzeReportRisk(report.reason, report.evidenceUrl);
      setAiAnalysis(result);
    } catch (error) {
      setAiAnalysis("分析中にエラーが発生しました。");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  */

  return (
    <div className={styles.container}>
      {/* リストビュー */}
      <div className={styles.listView}>
        <div className={styles.listHeader}>
          <h3 className={styles.listTitle}>通報一覧</h3>
        </div>
        <div className={styles.listContent}>
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => {
                setSelectedReport(report);
                // setAiAnalysis(""); // ★AI関連のためコメントアウト
              }}
              className={`${styles.listItem} ${
                selectedReport?.id === report.id ? styles.listItemSelected : ""
              }`}
            >
              <div className={styles.itemHeader}>
                <StatusBadge status={report.status} />
                <span className={styles.itemDate}>{report.createdAt}</span>
              </div>
              <p className={styles.itemReason}>{report.reason}</p>
              <p className={styles.itemTarget}>Target: {report.targetUserId}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 詳細ビュー */}
      <div className={styles.detailView}>
        {selectedReport ? (
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>
              <div>
                <h2 className={styles.detailTitle}>
                  通報詳細: {selectedReport.id}
                </h2>
                <div className={styles.detailMeta}>
                  <span>
                    通報者:{" "}
                    <span className={styles.metaValue}>
                      {selectedReport.reporterId}
                    </span>
                  </span>
                  <span>
                    対象者:{" "}
                    <span className={styles.metaValueRed}>
                      {selectedReport.targetUserId}
                    </span>
                  </span>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <button
                  onClick={() =>
                    updateStatus(selectedReport.id, ReportStatus.DISMISSED)
                  }
                  className={`${styles.actionBtn} ${styles.btnDismiss}`}
                >
                  <XCircle className={styles.btnIcon} /> 問題なし
                </button>
                <button
                  onClick={() =>
                    updateStatus(selectedReport.id, ReportStatus.RESOLVED)
                  }
                  className={`${styles.actionBtn} ${styles.btnResolve}`}
                >
                  <CheckCircle className={styles.btnIcon} /> 処置完了
                </button>
              </div>
            </div>

            <div className={styles.reasonBox}>
              <h4 className={styles.sectionTitle}>通報理由</h4>
              <p className={styles.reasonText}>{selectedReport.reason}</p>
            </div>

            {selectedReport.evidenceUrl && (
              <div className={styles.evidenceSection}>
                <h4 className={styles.sectionTitle}>証拠画像 (Evidence)</h4>
                <div className={styles.evidenceWrapper}>
                  {/* Next.js Image component recommended */}
                  <img
                    src={selectedReport.evidenceUrl}
                    alt="Evidence"
                    className={styles.evidenceImg}
                  />
                </div>
              </div>
            )}

            {/* ★Gemini AI Integration - コメントアウト */}
            {/*
            <div className={styles.aiSection}>
              <div className={styles.aiHeader}>
                <h4 className={styles.aiTitle}>
                  <BrainCircuit className={styles.aiIcon} />
                  AIリスク分析アシスタント
                </h4>
                <button
                  onClick={() => handleAiAnalyze(selectedReport)}
                  disabled={isAnalyzing}
                  className={styles.aiBtn}
                >
                  {isAnalyzing ? "分析中..." : "Geminiで分析"}
                </button>
              </div>

              {aiAnalysis ? (
                <div className={styles.aiResult}>{aiAnalysis}</div>
              ) : (
                <p className={styles.aiPlaceholder}>
                  ボタンを押すと、通報内容と証拠画像をGeminiが解析し、リスクレベルと法的観点からのアドバイスを生成します。
                </p>
              )}
            </div>
            */}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <AlertTriangle className={styles.emptyIcon} />
            <p>左側(または上部)のリストから通報を選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeClassMap: Record<ReportStatus, string> = {
    [ReportStatus.PENDING]: styles.badgePending,
    [ReportStatus.INVESTIGATING]: styles.badgeInvestigating,
    [ReportStatus.RESOLVED]: styles.badgeResolved,
    [ReportStatus.DISMISSED]: styles.badgeDismissed,
  };
  return (
    <span className={`${styles.badge} ${badgeClassMap[status]}`}>{status}</span>
  );
};
