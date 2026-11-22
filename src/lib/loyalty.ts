export const VISITS_PER_REWARD = 5;
export const VISIT_REWARD_CENTS = 1000;

export type VisitRewardProgress = {
  completedVisits: number;
  rewardsAvailable: number;
  visitsUntilReward: number;
  rewardValueCents: number;
};

export function getVisitRewardProgress(completedVisits: number, rewardsRedeemed: number): VisitRewardProgress {
  const safeVisits = Math.max(0, Math.floor(completedVisits));
  const safeRedeemed = Math.max(0, Math.floor(rewardsRedeemed));
  const rewardsEarned = Math.floor(safeVisits / VISITS_PER_REWARD);
  return {
    completedVisits: safeVisits,
    rewardsAvailable: Math.max(0, rewardsEarned - safeRedeemed),
    visitsUntilReward: VISITS_PER_REWARD - (safeVisits % VISITS_PER_REWARD),
    rewardValueCents: VISIT_REWARD_CENTS,
  };
}
