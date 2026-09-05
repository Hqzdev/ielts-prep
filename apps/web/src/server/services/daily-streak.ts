import "server-only";
import { cache } from "react";
import { backend } from "../backend";

export const currentDailyStreak = cache((userId: string, timezone: string) =>
  backend().streak.get(userId, timezone),
);
