"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { VISITS_PER_REWARD, VISIT_REWARD_CENTS, type VisitRewardProgress } from "@/lib/loyalty";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import ClientProfile from "./ClientProfile";

type Props = {
  onSessionChange: (session: Session | null) => void;
  applyReward: boolean;
  onApplyRewardChange: (apply: boolean) => void;
  initialMode?: Mode;
  standalone?: boolean;
};

type Mode = "closed" | "signin" | "signup" | "guest" | "update";

const field = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200";
const button = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export default function CustomerAccount({
  onSessionChange,
  applyReward,
  onApplyRewardChange,
  initialMode = "closed",
  standalone = false,
}: Props) {
  const authUnavailable = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState<VisitRewardProgress | null>(null);
  const [authError, setAuthError] = useState("");
  const [loyaltyError, setLoyaltyError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    const applySession = (next: Session | null) => {
      if (!active) return;
      setSession(next);
      onSessionChange(next);
      if (next?.user) {
        const name = next.user.user_metadata.full_name ?? next.user.user_metadata.name;
        if (typeof name === "string") setFullName(name);
        if (next.user.email) setEmail(next.user.email);
        setMode("closed");
      } else {
        setProgress(null);
        setLoyaltyError("");
        onApplyRewardChange(false);
      }
    };

    void client.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError("Could not restore your sign-in. Please sign in again.");
      applySession(data.session);
    }).catch(() => {
      if (active) setAuthError("Could not restore your sign-in. Please sign in again.");
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((event, next) => {
      applySession(next);
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [onApplyRewardChange, onSessionChange]);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    const controller = new AbortController();
    void fetch("/api/customer/loyalty", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load visit rewards.");
        return body as VisitRewardProgress;
      })
      .then(setProgress)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoyaltyError(error instanceof Error ? error.message : "Could not load visit rewards.");
      });
    return () => controller.abort();
  }, [session?.access_token, onApplyRewardChange]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError("");
    setNotice("");
    setBusy(true);
    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthError("Sign-in is temporarily unavailable. Please continue as a guest.");
      setBusy(false);
      return;
    }
    try {
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/book`,
          },
        });
        if (error) throw error;
        if (!data.session) setNotice("Check your email to confirm your account, then return here to sign in.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthError("Sign-in is temporarily unavailable. Please continue as a guest.");
      return;
    }
    setBusy(true);
    setAuthError("");
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/book`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) setAuthError(error.message);
    } catch {
      setAuthError("Could not start Google sign-in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    const client = getSupabaseBrowserClient();
    if (!client || !email.trim()) {
      setAuthError("Enter your email address first.");
      return;
    }
    setBusy(true);
    setAuthError("");
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/book`,
      });
      if (error) setAuthError(error.message);
      else setNotice("If an account exists for that email, a password reset link is on its way.");
    } catch {
      setAuthError("Could not send the password reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    try {
      const { error } = await client.auth.signOut();
      if (error) setAuthError(error.message);
      else {
        setProgress(null);
        onApplyRewardChange(false);
      }
    } catch {
      setAuthError("Could not sign out. Please try again.");
    }
  }

  async function updatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    setAuthError("");
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) setAuthError(error.message);
      else {
        setPassword("");
        setMode("closed");
        setNotice("Your password has been updated.");
      }
    } catch {
      setAuthError("Could not update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (session?.user && mode === "update") {
    return (
      <section className="rounded-2xl border border-primary/70 bg-surface p-4 text-foreground">
        <form onSubmit={updatePassword} className="space-y-3">
          <h2 className="font-semibold">Choose a new password</h2>
          <label className="block text-sm">New password
            <input className={field} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {authError && <p role="alert" className="text-sm text-red-300">{authError}</p>}
          <button type="submit" className={`${button} bg-primary text-black`} disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
        </form>
      </section>
    );
  }

  if (session?.user) {
    if (standalone) {
      return <ClientProfile session={session} onSignOut={signOut} />;
    }
    const name = fullName || session.user.email || "customer";
    return (
      <section className="space-y-3 rounded-2xl border border-primary/70 bg-surface p-4 text-foreground" aria-label="Customer account">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Welcome, {name}</p>
            <p className="text-sm text-foreground/70">Your completed visits earn rewards automatically.</p>
          </div>
          <button type="button" className="text-sm text-primary underline" onClick={signOut}>Sign out</button>
        </div>
        {progress && (
          <div className="rounded-xl border border-border p-3">
            <p className="font-semibold">Loyalty reward: ${VISIT_REWARD_CENTS / 100} off every {VISITS_PER_REWARD} completed visits</p>
            <p className="mt-1 text-sm text-foreground/70">
              {progress.completedVisits} completed {progress.completedVisits === 1 ? "visit" : "visits"} · {progress.rewardsAvailable
                ? `${progress.rewardsAvailable} reward${progress.rewardsAvailable === 1 ? "" : "s"} ready`
                : `${progress.visitsUntilReward} more to your next reward`}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/50" role="progressbar"
              aria-label="Progress toward your next reward"
              aria-valuenow={progress.completedVisits % VISITS_PER_REWARD}
              aria-valuemin={0} aria-valuemax={VISITS_PER_REWARD}>
              <div className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${((progress.completedVisits % VISITS_PER_REWARD) / VISITS_PER_REWARD) * 100}%` }} />
            </div>
            {progress.rewardsAvailable > 0 && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={applyReward} onChange={(e) => onApplyRewardChange(e.target.checked)} />
                Apply a $10 reward to this booking ({progress.rewardsAvailable} available)
              </label>
            )}
          </div>
        )}
        {loyaltyError && <p role="alert" className="text-sm text-amber-300">{loyaltyError}</p>}
      </section>
    );
  }

  if (mode === "guest") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4 text-foreground">
        <p className="font-semibold">Continuing as a guest</p>
        <p className="mt-1 text-sm text-foreground/70">You can book without an account. Sign in to earn and use visit rewards.</p>
        <button type="button" className="mt-2 text-sm text-primary underline" onClick={() => { setMode("closed"); setAuthError(""); }}>
          Sign in or create an account
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 text-foreground" aria-label="Sign in or book as a guest">
      <div>
        <h2 className="font-semibold">Earn $10 off every 5 completed visits</h2>
        <p className="text-sm text-foreground/70">Sign in to earn rewards, or continue as a guest.</p>
      </div>
      {mode === "closed" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${button} bg-primary text-black hover:bg-primary/80`} onClick={() => { setMode("signin"); setAuthError(""); }}>
            Sign in / Join
          </button>
          <button type="button" className={`${button} border border-primary text-primary hover:bg-primary/10`} onClick={signInWithGoogle} disabled={busy}>
            Continue with Google
          </button>
          {!standalone && (
            <button type="button" className={`${button} border border-border text-foreground hover:bg-white/5`} onClick={() => setMode("guest")}>
              Continue as guest
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 text-sm">
            <button type="button" className={mode === "signin" ? "text-primary underline" : "text-foreground/60"} onClick={() => { setMode("signin"); setAuthError(""); }}>Sign in</button>
            <button type="button" className={mode === "signup" ? "text-primary underline" : "text-foreground/60"} onClick={() => { setMode("signup"); setAuthError(""); }}>Create account</button>
          </div>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            {mode === "signup" && (
              <label className="text-sm sm:col-span-2">Name
                <input className={field} autoComplete="name" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
            )}
            <label className="text-sm sm:col-span-2">Email
              <input className={field} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="text-sm sm:col-span-2">Password
              <input className={field} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {mode === "signin" && (
              <button type="button" disabled={busy} className="text-left text-sm text-primary underline sm:col-span-2" onClick={sendPasswordReset}>
                Forgot password?
              </button>
            )}
            <button type="submit" className={`${button} bg-primary text-black hover:bg-primary/80`} disabled={busy}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
            <button type="button" className={`${button} border border-primary text-primary hover:bg-primary/10`} onClick={signInWithGoogle} disabled={busy}>
              Continue with Google
            </button>
          </form>
          {!standalone && (
            <button type="button" className="text-sm text-foreground/70 underline" onClick={() => { setMode("guest"); setAuthError(""); }}>
              Continue as guest instead
            </button>
          )}
        </>
      )}
      {notice && <p role="status" className="text-sm text-green-300">{notice}</p>}
      {authError && <p role="alert" className="text-sm text-red-300">{authError}</p>}
      {authUnavailable && <p role="alert" className="text-sm text-amber-300">Sign-in is temporarily unavailable. You can still book as a guest.</p>}
    </section>
  );
}
