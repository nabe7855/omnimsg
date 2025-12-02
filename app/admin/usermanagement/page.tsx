"use client";

import {
  Ban,
  CheckSquare,
  Filter,
  Lock,
  MoreHorizontal,
  Search,
  Shield,
  Unlock,
} from "lucide-react";
import React, { useState } from "react";
import styles from "./user-management.module.css";

// 定数・型のインポート（環境に合わせてパスを修正してください）
import { MOCK_USERS } from "@/adminconstants";
import { User, UserRole, UserStatus } from "@/lib/types";

interface BadgeRoleProps {
  role: UserRole;
}

interface BadgeStatusProps {
  status: UserStatus;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "ALL">("ALL");

  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // フィルタリング処理
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "ALL" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "ALL" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // 個別ステータス変更
  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    if (
      confirm(`ユーザー ${userId} のステータスを ${newStatus} に変更しますか？`)
    ) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      setSelectedUser(null);
    }
  };

  // 一括選択
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // 一括操作
  const handleBulkAction = (newStatus: UserStatus) => {
    if (selectedIds.size === 0) return;
    if (
      confirm(
        `選択した ${selectedIds.size} 名のユーザーを ${newStatus} に変更しますか？`
      )
    ) {
      setUsers((prev) =>
        prev.map((u) =>
          selectedIds.has(u.id) ? { ...u, status: newStatus } : u
        )
      );
      setSelectedIds(new Set());
    }
  };

  const isAllSelected =
    filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <h2 className={styles.pageTitle}>
            <Shield className={styles.titleIcon} />
            ユーザー管理警察
          </h2>

          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="ID, 名前, Email検索"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* フィルター & アクションバー */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <div className={styles.filterItem}>
              <Filter className={styles.filterIcon} />
              <select
                value={filterRole}
                onChange={(e) =>
                  setFilterRole(e.target.value as UserRole | "ALL")
                }
                className={styles.select}
              >
                <option value="ALL">全権限</option>
                <option value={UserRole.USER}>User</option>
                <option value={UserRole.CAST}>Cast</option>
                <option value={UserRole.STORE}>Store</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>

            <div className={styles.divider}>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as UserStatus | "ALL")
                }
                className={styles.select}
              >
                <option value="ALL">全ステータス</option>
                <option value={UserStatus.ACTIVE}>Active</option>
                <option value={UserStatus.SUSPENDED}>Suspended</option>
                <option value={UserStatus.BANNED}>Banned</option>
              </select>
            </div>

            <div className={styles.userCount}>{filteredUsers.length} users</div>
          </div>

          {/* 一括操作ボタン (選択時のみ表示) */}
          {selectedIds.size > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.selectedCount}>
                <CheckSquare className={styles.checkIcon} />
                {selectedIds.size} 選択
              </span>
              <div className={styles.bulkDivider}></div>
              <div className={styles.bulkBtnGroup}>
                <button
                  onClick={() => handleBulkAction(UserStatus.SUSPENDED)}
                  className={`${styles.bulkBtn} ${styles.btnOrange}`}
                >
                  <Lock className={styles.btnIcon} /> 凍結
                </button>
                <button
                  onClick={() => handleBulkAction(UserStatus.BANNED)}
                  className={`${styles.bulkBtn} ${styles.btnRed}`}
                >
                  <Ban className={styles.btnIcon} /> BAN
                </button>
                <button
                  onClick={() => handleBulkAction(UserStatus.ACTIVE)}
                  className={`${styles.bulkBtn} ${styles.btnGreen}`}
                >
                  <Unlock className={styles.btnIcon} /> 解除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={`${styles.th} ${styles.thCheckbox}`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className={styles.checkbox}
                  />
                </th>
                <th className={styles.th}>ユーザー</th>
                <th className={styles.th}>権限</th>
                <th className={styles.th}>ステータス</th>
                <th className={styles.th}>被通報数</th>
                <th className={styles.th}>登録日</th>
                <th className={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`${styles.tr} ${
                    selectedIds.has(user.id) ? styles.trSelected : ""
                  }`}
                >
                  <td className={styles.td}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className={styles.checkbox}
                    />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.userInfo}>
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className={styles.avatar}
                      />
                      <div>
                        <p className={styles.userName}>{user.name}</p>
                        <p className={styles.userEmail}>{user.email}</p>
                        <p className={styles.userId}>ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <BadgeRole role={user.role} />
                  </td>
                  <td className={styles.td}>
                    <BadgeStatus status={user.status} />
                  </td>
                  <td className={styles.td}>
                    <div
                      className={`${styles.reportCount} ${
                        user.reportCount > 5 ? styles.textRed : styles.textSlate
                      }`}
                    >
                      {user.reportCount}件
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.dateText}>{user.registeredAt}</span>
                  </td>
                  <td className={styles.td}>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className={styles.actionBtnCell}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    条件に一致するユーザーは見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>ユーザー詳細・処置</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalUserSummary}>
              <img
                src={selectedUser.avatarUrl}
                className={styles.modalAvatar}
                alt="avatar"
              />
              <div style={{ overflow: "hidden" }}>
                <p className={styles.modalUserName}>{selectedUser.name}</p>
                <div className={styles.modalBadges}>
                  <BadgeRole role={selectedUser.role} />
                  <BadgeStatus status={selectedUser.status} />
                </div>
                <p className={styles.modalUserDetail}>{selectedUser.email}</p>
                <p className={styles.modalUserDetail}>ID: {selectedUser.id}</p>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() =>
                  handleStatusChange(selectedUser.id, UserStatus.SUSPENDED)
                }
                disabled={selectedUser.status === UserStatus.SUSPENDED}
                className={`${styles.actionCardBtn} ${styles.cardBtnOrange}`}
              >
                <Lock size={24} style={{ marginBottom: "0.5rem" }} />
                <span className={styles.btnLabel}>凍結 (Suspend)</span>
                <span className={styles.btnSubLabel}>一時的な利用停止</span>
              </button>

              <button
                onClick={() =>
                  handleStatusChange(selectedUser.id, UserStatus.BANNED)
                }
                disabled={selectedUser.status === UserStatus.BANNED}
                className={`${styles.actionCardBtn} ${styles.cardBtnRed}`}
              >
                <Ban size={24} style={{ marginBottom: "0.5rem" }} />
                <span className={styles.btnLabel}>永久追放 (BAN)</span>
                <span className={styles.btnSubLabel}>ブラックリスト追加</span>
              </button>

              {selectedUser.status !== UserStatus.ACTIVE && (
                <button
                  onClick={() =>
                    handleStatusChange(selectedUser.id, UserStatus.ACTIVE)
                  }
                  className={`${styles.actionCardBtn} ${styles.cardBtnGreen}`}
                >
                  <Unlock size={20} style={{ marginRight: "0.5rem" }} />
                  処置解除 (Activeに戻す)
                </button>
              )}
            </div>

            <div className={styles.modalNote}>
              ※
              BAN処理を行うと、電話番号と端末識別子もブラックリストに追加されます。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BadgeRole: React.FC<BadgeRoleProps> = ({ role }) => {
  const roleClassMap: Record<UserRole, string> = {
    [UserRole.USER]: styles.roleUser,
    [UserRole.CAST]: styles.roleCast,
    [UserRole.STORE]: styles.roleStore,
    [UserRole.ADMIN]: styles.roleAdmin,
  };
  return (
    <span className={`${styles.badge} ${roleClassMap[role]}`}>{role}</span>
  );
};

const BadgeStatus: React.FC<BadgeStatusProps> = ({ status }) => {
  const statusClassMap: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: styles.statusActive,
    [UserStatus.SUSPENDED]: styles.statusSuspended,
    [UserStatus.BANNED]: styles.statusBanned,
  };
  return (
    <span className={`${styles.badge} ${statusClassMap[status]}`}>
      {status}
    </span>
  );
};
