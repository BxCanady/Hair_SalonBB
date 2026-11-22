CREATE TABLE public.customer_loyalty_visits (
  appointment_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_loyalty_visits_user_id_idx
  ON public.customer_loyalty_visits (user_id);

CREATE TABLE public.customer_loyalty_redemptions (
  appointment_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_loyalty_redemptions_user_id_idx
  ON public.customer_loyalty_redemptions (user_id);

ALTER TABLE public.customer_loyalty_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty_redemptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.customer_loyalty_visits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.customer_loyalty_redemptions FROM PUBLIC, anon, authenticated;