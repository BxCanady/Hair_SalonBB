"use client";
import { addDays, fmtDate } from "@/lib/time";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Month calendar. `month` is any date in the month (YYYY-MM-DD). */
export default function MonthGrid({
  month,
  selected,
  onSelect,
  disabled,
  badge,
}: {
  month: string;
  selected?: string;
  onSelect: (d: string) => void;
  disabled?: (d: string) => boolean;
  badge?: (d: string) => number;
}) {
  const first = `${month.slice(0, 7)}-01`;
  const lead = new Date(`${first}T00:00:00Z`).getUTCDay();
  const start = addDays(first, -lead);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const today = fmtDate(new Date());
  return (
    <div role="group" aria-label="Calendar" className="grid grid-cols-7 gap-1 text-center text-sm">
      {DOW.map((d) => (
        <div key={d} className="py-1 text-xs font-medium text-gray-500">
          {d}
        </div>
      ))}
      {days.map((d) => {
        const inMonth = d.slice(0, 7) === first.slice(0, 7);
        const off = !!disabled?.(d);
        const n = badge?.(d) ?? 0;
        return (
          <button
            key={d}
            type="button"
            disabled={off}
            aria-pressed={selected === d}
            aria-label={`${d}${n ? `, ${n} appointments` : ""}`}
            onClick={() => onSelect(d)}
            className={`relative min-h-11 rounded-lg border p-1 transition ${
              selected === d
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-transparent hover:bg-violet-50"
            } ${!inMonth ? "text-gray-300" : ""} ${d === today && selected !== d ? "ring-1 ring-violet-400" : ""} disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent`}
          >
            {Number(d.slice(8))}
            {n > 0 && (
              <span className={`absolute right-1 top-1 rounded-full px-1 text-[10px] ${selected === d ? "bg-white text-violet-700" : "bg-violet-100 text-violet-700"}`}>
                {n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
