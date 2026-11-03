"use client";
import { useCallback, useEffect, useState } from "react";
import ScheduleTab from "./ScheduleTab";
import OwnerTab from "./OwnerTab";
import ServicesTab from "./ServicesTab";
import HairstyleManager from "./HairstyleManager";
import AdminLogin, { useAdminToken } from "./AdminLogin";
import { authHeaders, clearToken } from "@/lib/adminClient";
import type { Appointment, Service, Staff } from "@/lib/types";

const tabs = ["Schedule", "Owner profile", "Services", "Hairstyles"] as const;

class AuthError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: authHeaders() });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error();
  return res.json();
}

const fetchAll = () => Promise.all([getJson<Service[]>("/api/services"), getJson<Staff[]>("/api/staff"), getJson<Appointment[]>("/api/appointments")]);

export default function Dashboard() {
  const token = useAdminToken();
  return token ? <DashboardContent /> : <AdminLogin />;
}

function DashboardContent() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Schedule");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  const apply = ([sv, st, ap]: [Service[], Staff[], Appointment[]]) => {
    setServices(sv);
    setStaff(st);
    setAppointments(ap);
    setError("");
  };
  const fail = (e: unknown) => {
    if (e instanceof AuthError) return clearToken();
    setError("Could not load data. Are you offline?");
  };
  const load = useCallback(async () => {
    try {
      apply(await fetchAll());
    } catch (e) {
      fail(e);
    }
  }, []);

  useEffect(() => {
    let live = true;
    fetchAll()
      .then((r) => live && apply(r))
      .catch((e) => live && fail(e));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="mb-4 flex items-end justify-between border-b border-gray-200">
        <div role="tablist" className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-violet-600 text-violet-700" : "text-gray-500 hover:text-gray-800"}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={clearToken} className="px-2 py-2 text-sm text-gray-500 underline">Sign out</button>
      </div>
      <div role="tabpanel">
        {tab === "Schedule" && <ScheduleTab services={services} stylist={staff[0] ?? null} appointments={appointments} reload={load} />}
        {tab === "Owner profile" && <OwnerTab services={services} owner={staff[0] ?? null} reload={load} />}
        {tab === "Services" && <ServicesTab services={services} reload={load} />}
        {tab === "Hairstyles" && <HairstyleManager services={services} />}
      </div>
    </div>
  );
}
