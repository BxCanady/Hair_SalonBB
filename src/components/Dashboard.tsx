"use client";
import { useCallback, useEffect, useState } from "react";
import ScheduleTab from "./ScheduleTab";
import OwnerTab from "./OwnerTab";
import ServicesTab from "./ServicesTab";
import type { Appointment, Service, Staff } from "@/lib/types";

const tabs = ["Schedule", "Owner profile", "Services"] as const;

export default function Dashboard() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Schedule");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  const fetchAll = () => Promise.all(["services", "staff", "appointments"].map((p) => fetch(`/api/${p}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); })));
  const apply = ([sv, st, ap]: [Service[], Staff[], Appointment[]]) => {
    setServices(sv);
    setStaff(st);
    setAppointments(ap);
    setError("");
  };
  const load = useCallback(async () => {
    try {
      apply((await fetchAll()) as [Service[], Staff[], Appointment[]]);
    } catch {
      setError("Could not load data. Are you offline?");
    }
  }, []);

  useEffect(() => {
    let live = true;
    fetchAll()
      .then((r) => live && apply(r as [Service[], Staff[], Appointment[]]))
      .catch(() => live && setError("Could not load data. Are you offline?"));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      <div role="tablist" className="mb-4 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-violet-600 text-violet-700" : "text-gray-500 hover:text-gray-800"}`}>
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "Schedule" && <ScheduleTab services={services} stylist={staff[0] ?? null} appointments={appointments} reload={load} />}
        {tab === "Owner profile" && <OwnerTab services={services} owner={staff[0] ?? null} reload={load} />}
        {tab === "Services" && <ServicesTab services={services} reload={load} />}
      </div>
    </div>
  );
}

