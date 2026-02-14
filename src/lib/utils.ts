import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SessionResult } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeScore(result: SessionResult): number {
  return result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
}
