"use client";
import { useState, useSyncExternalStore } from "react";
import { getToken, signIn, subscribeToken } from "@/lib/adminClient";
import { Button, inputCls, cardCls } from "./ui";

export function useAdminToken() {
  return useSyncExternalStore(subscribeToken, getToken, () => null);
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError((await signIn(email, password)) ?? "");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className={`${cardCls} mx-auto max-w-sm space-y-3`}>
      <h2 className="text-lg font-semibold">Administrator sign in</h2>
      <label className="block text-sm font-medium">Email
        <input className={inputCls} type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">Password
        <input className={inputCls} type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
