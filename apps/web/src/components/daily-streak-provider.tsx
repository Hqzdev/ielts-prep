"use client";
import { api, apiData } from "@/client/api";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { DailyStreak } from "@veylo/backend/domain/daily-streak";
import { StreakFlame } from "./streak-flame";

const DailyStreakContext = createContext<DailyStreak | null>(null);

export function useDailyStreak() {
  const streak = useContext(DailyStreakContext);
  if (!streak) throw new Error("DailyStreakProvider is required");
  return streak;
}

export function DailyStreakProvider({
  initial,
  children,
}: {
  initial: DailyStreak;
  children: React.ReactNode;
}) {
  const [streak, setStreak] = useState(initial);
  const [celebration, setCelebration] = useState<DailyStreak | null>(null);
  const latest = useRef(initial);
  const pathname = usePathname();

  useEffect(() => {
    const abort = new AbortController();
    let pending = false;
    let queued = false;
    const refresh = async () => {
      if (document.visibilityState === "hidden" || abort.signal.aborted) return;
      if (pending) {
        queued = true;
        return;
      }
      pending = true;
      try {
        const next = await apiData(
          api.GET("/streak", { cache: "no-store", signal: abort.signal }),
        );
        if (abort.signal.aborted) return;
        if (
          !latest.current.todayComplete &&
          next.todayComplete &&
          latest.current.today === next.today
        )
          setCelebration(next);
        latest.current = next;
        setStreak(next);
      } catch {
        return;
      } finally {
        pending = false;
        if (queued) {
          queued = false;
          void refresh();
        }
      }
    };
    const sync = () => {
      void refresh();
    };
    sync();
    const interval = window.setInterval(sync, 60000);
    window.addEventListener("veylo:learning-activity", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      abort.abort();
      clearInterval(interval);
      window.removeEventListener("veylo:learning-activity", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [pathname]);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(null), 6500);
    return () => clearTimeout(timer);
  }, [celebration]);

  return (
    <DailyStreakContext.Provider value={streak}>
      {children}
      {celebration && (
        <div className="streak-celebration" role="status">
          <StreakFlame size={64} />
          <div>
            <strong>Today&apos;s flame is lit!</strong>
            <p>
              {celebration.current} {celebration.current === 1 ? "day" : "days"}{" "}
              in a row. See you tomorrow.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss streak celebration"
            onClick={() => setCelebration(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </DailyStreakContext.Provider>
  );
}
