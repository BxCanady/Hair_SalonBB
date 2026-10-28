"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  User,
} from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Book",
    href: "/book",
    icon: CalendarDays,
  },
  {
    label: "Owner",
    href: "/dashboard",
    icon: User,
  },
];

export default function MobileNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md text-xs ${active ? "font-medium text-pink-600" : "text-neutral-500"}`}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}