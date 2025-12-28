"use client";

import { AuthFormScreen } from "@/components/screens/AuthFormScreen";
import { RoleSelectionScreen } from "@/components/screens/RoleSelectionScreen";
import { UserRole } from "@/lib/types";
import { LoginProps } from "@/lib/types/screen";
import React, { useState } from "react";

export const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  if (!selectedRole) {
    return <RoleSelectionScreen onRoleSelect={handleRoleSelect} />;
  }

  return (
    <AuthFormScreen
      selectedRole={selectedRole}
      onBack={handleBack}
      onLogin={onLogin}
    />
  );
};
