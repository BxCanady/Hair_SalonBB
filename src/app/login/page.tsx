import Link from "next/link";
import CustomerLogin from "@/components/CustomerLogin";

export const metadata = { title: "Client login · Beast at Braid" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl items-start justify-center px-4 py-8">
      <div className="w-full">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Client account</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in to manage visit rewards and book as a returning client.
          </p>
        </div>
        <CustomerLogin />
        <p className="mt-5 text-center text-sm text-white/50">
          Salon owner?{" "}
          <Link href="/dashboard" className="font-semibold text-primary underline underline-offset-4">
            Open the admin login
          </Link>
        </p>
      </div>
    </main>
  );
}
