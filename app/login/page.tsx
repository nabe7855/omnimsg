"use client";

import { LoginScreen } from "@/components/screens/Screens";
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const { login } = useAuth();

  return <LoginScreen onLogin={login} />;
}
