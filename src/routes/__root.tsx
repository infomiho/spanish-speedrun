import { createRootRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Languages, BarChart3, BookOpen, RefreshCcw } from "lucide-react";
import { useSrsStore } from "@/stores/srs";
import { getDueCards as getDueCardsLib } from "@/lib/srs";
import { cn } from "@/lib/utils";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  const cards = useSrsStore((s) => s.cards);
  const dueCount = useMemo(
    () => getDueCardsLib(Object.values(cards)).length,
    [cards],
  );

  const navItems = [
    { to: "/dashboard", icon: BookOpen, label: "Learn" },
    { to: "/review", icon: RefreshCcw, label: "Review", badge: dueCount },
    { to: "/stats", icon: BarChart3, label: "Stats" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-red-500/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 text-white shadow-sm">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Spanish Speedrun
              </h1>
              <p className="text-xs text-muted-foreground">
                10 days to functional Spanish
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="container mx-auto max-w-2xl">
          <div className="grid grid-cols-3 h-14">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.to ||
                location.pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 text-xs transition-colors relative",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <Toaster />
    </div>
  );
}
