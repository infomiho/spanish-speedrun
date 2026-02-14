import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCurrentDay } from "@/hooks/useCurrentDay";

export function useDayGuard(dayNum: number): boolean {
  const navigate = useNavigate();
  const currentDay = useCurrentDay();

  const allowed = dayNum >= 1 && dayNum <= 10 && dayNum <= currentDay;

  useEffect(() => {
    if (!allowed) {
      toast("Day not available yet");
      navigate({ to: "/dashboard" });
    }
  }, [allowed, navigate]);

  return allowed;
}
