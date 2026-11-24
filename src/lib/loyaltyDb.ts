import { Pool } from "pg";
import { getVisitRewardProgress } from "./loyalty";

const globalForPg = globalThis as typeof globalThis & { __salonLoyaltyPool?: Pool };

function getPool(): Pool {
  if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is not configured");
  globalForPg.__salonLoyaltyPool ??= new Pool({
    connectionString: process.env.DIRECT_URL,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
  return globalForPg.__salonLoyaltyPool;
}

export async function getCustomerVisitRewards(userId: string) {
  const { rows } = await getPool().query<{ completed_visits: string; rewards_redeemed: string }>(
    `SELECT
       (SELECT COUNT(*) FROM public.customer_loyalty_visits WHERE user_id = $1) AS completed_visits,
       (SELECT COUNT(*) FROM public.customer_loyalty_redemptions WHERE user_id = $1) AS rewards_redeemed`,
    [userId],
  );
  const row = rows[0];
  if (!row) throw new Error("Unable to read customer visit rewards");
  return getVisitRewardProgress(Number(row.completed_visits), Number(row.rewards_redeemed));
}

export async function recordCompletedVisit(userId: string, appointmentId: string): Promise<void> {
  await getPool().query(
    `INSERT INTO public.customer_loyalty_visits (appointment_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (appointment_id) DO NOTHING`,
    [appointmentId, userId],
  );
}

export async function redeemVisitReward(userId: string, appointmentId: string): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [userId]);
    const { rows } = await client.query<{ completed_visits: string; rewards_redeemed: string }>(
      `SELECT
         (SELECT COUNT(*) FROM public.customer_loyalty_visits WHERE user_id = $1) AS completed_visits,
         (SELECT COUNT(*) FROM public.customer_loyalty_redemptions WHERE user_id = $1) AS rewards_redeemed`,
      [userId],
    );
    const progress = getVisitRewardProgress(Number(rows[0]?.completed_visits ?? 0), Number(rows[0]?.rewards_redeemed ?? 0));
    if (!progress.rewardsAvailable) {
      await client.query("ROLLBACK");
      client.release();
      return false;
    }
    await client.query(
      `INSERT INTO public.customer_loyalty_redemptions (appointment_id, user_id)
       VALUES ($1, $2)`,
      [appointmentId, userId],
    );
    await client.query("COMMIT");
    client.release();
    return true;
  } catch (error) {
    client.release(true);
    throw error;
  }
}

export async function refundVisitReward(userId: string, appointmentId: string): Promise<void> {
  await getPool().query(
    `DELETE FROM public.customer_loyalty_redemptions
     WHERE appointment_id = $1 AND user_id = $2`,
    [appointmentId, userId],
  );
}
