import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/day/$dayId")({
  component: DayLayout,
});

function DayLayout() {
  return <Outlet />;
}
