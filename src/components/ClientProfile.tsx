"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CalendarDays, Check, Clock3, Gift, History, Sparkles } from "lucide-react";
import type { CustomerProfileData } from "@/lib/customerProfile";
import { fmt12 } from "@/lib/time";
import { VISITS_PER_REWARD } from "@/lib/loyalty";

type ProfileResponse = CustomerProfileData & {
  name: string;
  email: string | null;
};

export default function ClientProfile({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => void;
}) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/customer/profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? "Could not load your profile");
        return body as ProfileResponse;
      })
      .then(setProfile)
      .catch((failure: unknown) => {
        if (failure instanceof Error && failure.name === "AbortError") return;
        setError(failure instanceof Error ? failure.message : "Could not load your profile");
      });
    return () => controller.abort();
  }, [session.access_token]);

  const upcoming = useMemo(
    () => profile?.appointments.filter((appointment) =>
      appointment.status !== "completed" && appointment.status !== "cancelled",
    ).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)) ?? [],
    [profile],
  );
  const past = useMemo(
    () => profile?.appointments.filter((appointment) =>
      appointment.status === "completed" || appointment.status === "cancelled",
    ) ?? [],
    [profile],
  );

  if (error) {
    return (
      <section className="rounded-3xl border border-red-300/30 bg-black/70 p-6 text-white">
        <p role="alert" className="text-sm text-red-200">{error}</p>
        <button type="button" onClick={onSignOut} className="mt-4 text-sm font-semibold text-primary underline">
          Sign out
        </button>
      </section>
    );
  }
  if (!profile) {
    return (
      <section aria-busy="true" className="space-y-4 rounded-3xl border border-white/10 bg-[#171017] p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
        <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-52 animate-pulse rounded-2xl bg-white/5" />
      </section>
    );
  }

  const progressVisits = profile.reward.completedVisits % VISITS_PER_REWARD;
  const progressPercent = (progressVisits / VISITS_PER_REWARD) * 100;
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-[#24102f] to-black p-5 text-white shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Client dashboard</p>
            <h2 className="mt-2 text-2xl font-bold">Hey, {profile.name}</h2>
            {profile.email && <p className="mt-1 text-sm text-white/60">{profile.email}</p>}
          </div>
          <button type="button" onClick={onSignOut} className="text-sm font-semibold text-primary underline">
            Sign out
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={<CalendarDays size={18} />} value={upcoming.length} label="Upcoming" />
          <Stat icon={<History size={18} />} value={profile.reward.completedVisits} label="Completed visits" />
          <Stat icon={<Gift size={18} />} value={profile.reward.rewardsAvailable} label="Rewards ready" className="col-span-2 sm:col-span-1" />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#171017] p-5 text-white sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-semibold"><Gift className="text-primary" size={19} /> Visit reward</p>
            <p className="mt-1 text-sm text-white/60">
              {profile.reward.rewardsAvailable > 0
                ? `${profile.reward.rewardsAvailable} reward ready to use`
                : `${profile.reward.visitsUntilReward} more visit${profile.reward.visitsUntilReward === 1 ? "" : "s"} until $10 off`}
            </p>
          </div>
          <span className="text-right text-2xl font-black text-primary">{progressVisits}/{VISITS_PER_REWARD}</span>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-black/60"
          role="progressbar"
          aria-label="Progress toward your next visit reward"
          aria-valuemin={0}
          aria-valuemax={VISITS_PER_REWARD}
          aria-valuenow={progressVisits}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-[width] duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/45">
          <span>Every completed visit counts</span>
          <span>$10 reward at {VISITS_PER_REWARD}</span>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#171017] p-5 text-white sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarDays className="text-primary" size={20} /> Upcoming visits</h2>
          <Link href="/book" className="text-sm font-semibold text-primary underline">Book a visit</Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState icon={<Clock3 size={22} />} text="No upcoming visits. Your next look is one booking away." />
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((appointment) => (
              <li key={appointment.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{appointment.serviceName}</p>
                    <p className="mt-1 text-sm text-white/60">{appointment.date} at {fmt12(appointment.time)}</p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold capitalize text-primary">{appointment.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#171017] p-5 text-white sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="text-primary" size={20} /> Past styles & visits</h2>
        {past.length === 0 && profile.visitHistory.length === 0 ? (
          <EmptyState icon={<History size={22} />} text="Completed appointments and past styles will appear here." />
        ) : (
          <ul className="mt-4 space-y-3">
            {past.map((appointment) => (
              <li key={appointment.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${appointment.status === "completed" ? "bg-green-400/15 text-green-300" : "bg-white/10 text-white/45"}`}>
                  {appointment.status === "completed" ? <Check size={18} /> : <History size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{appointment.serviceName}</p>
                  <p className="text-sm text-white/55">{appointment.date} · {appointment.status === "completed" ? "Completed" : "Cancelled"}</p>
                </div>
                <Link href={`/book?serviceId=${encodeURIComponent(appointment.serviceId)}`} className="text-sm font-semibold text-primary">
                  Rebook
                </Link>
              </li>
            ))}
            {profile.visitHistory
              .filter((visit) => !past.some((appointment) => appointment.id === visit.appointmentId))
              .map((visit) => (
                <li key={visit.appointmentId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-400/15 text-green-300"><Check size={18} /></span>
                  <div>
                    <p className="font-semibold">{visit.serviceName ?? "Completed salon visit"}</p>
                    <p className="text-sm text-white/55">{new Date(visit.completedAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, value, label, className = "" }: { icon: React.ReactNode; value: number; label: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.05] p-4 ${className}`}>
      <div className="flex items-center gap-2 text-primary">{icon}<span className="text-2xl font-black text-white">{value}</span></div>
      <p className="mt-1 text-xs text-white/55">{label}</p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mt-4 flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center text-sm text-white/50">
      {icon}
      <p className="mt-2 max-w-xs">{text}</p>
    </div>
  );
}
