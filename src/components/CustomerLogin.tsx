"use client";

import { useCallback } from "react";
import CustomerAccount from "./CustomerAccount";

export default function CustomerLogin() {
  const handleSessionChange = useCallback(() => {}, []);
  const handleRewardChange = useCallback(() => {}, []);

  return (
    <CustomerAccount
      initialMode="signin"
      standalone
      applyReward={false}
      onSessionChange={handleSessionChange}
      onApplyRewardChange={handleRewardChange}
    />
  );
}
