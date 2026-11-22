import { describe, expect, it } from "vitest";
import { getVisitRewardProgress, VISIT_REWARD_CENTS, VISITS_PER_REWARD } from "./loyalty";

describe("visit reward progress", () => {
  it("uses five completed visits for a $10 reward", () => {
    expect(VISITS_PER_REWARD).toBe(5);
    expect(VISIT_REWARD_CENTS).toBe(1000);
    expect(getVisitRewardProgress(4, 0)).toEqual({
      completedVisits: 4,
      rewardsAvailable: 0,
      visitsUntilReward: 1,
      rewardValueCents: 1000,
    });
    expect(getVisitRewardProgress(5, 0)).toEqual({
      completedVisits: 5,
      rewardsAvailable: 1,
      visitsUntilReward: 5,
      rewardValueCents: 1000,
    });
  });

  it("carries earned rewards forward and subtracts redeemed rewards", () => {
    expect(getVisitRewardProgress(10, 1)).toMatchObject({
      completedVisits: 10,
      rewardsAvailable: 1,
      visitsUntilReward: 5,
    });
    expect(getVisitRewardProgress(9, 1)).toMatchObject({
      rewardsAvailable: 0,
      visitsUntilReward: 1,
    });
  });

  it("normalizes invalid counts without creating rewards", () => {
    expect(getVisitRewardProgress(-1, -3)).toMatchObject({
      completedVisits: 0,
      rewardsAvailable: 0,
      visitsUntilReward: 5,
    });
  });
});
