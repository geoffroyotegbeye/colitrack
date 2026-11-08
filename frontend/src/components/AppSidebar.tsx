import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { navFor, isNavGroup, type NavEntry } from "@/lib/navConfig";

function isEntryActive(entry: NavEntry, pathname: string): boolean {
  if (isNavGroup(entry)) return entry.items.some((i) => isEntryActive(i, pathname));
  return pathname === entry.href || (entry.href !== "/dashboard" && entry.href !== "/tracking" && pathname.startsWith(entry.href));
}

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin, isAgent } = useAuth();
  const navItems = navFor(isAdmin, isAgent);
  const [openGroup, setOpenGroup] = useState<string | null>(
    () => navItems.filter(isNavGroup).find((g) => isEntryActive(g, location.pathname))?.label ?? null
  );

  const linkClass = (active: boolean) => cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
  );

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gradient-brand h-full overflow-y-auto">
      <div className="p-6 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
            <Package className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading text-primary-foreground">ColiTrack</h1>
            <p className="text-xs text-sidebar-muted">Import & Tracking</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-1">
        {navItems.map((entry) => {
          if (!isNavGroup(entry)) {
            const active = isEntryActive(entry, location.pathname);
            return (
              <Link key={entry.href} to={entry.href} className={linkClass(active)}>
                <entry.icon className="h-4 w-4" />
                {entry.label}
              </Link>
            );
          }
          const groupActive = isEntryActive(entry, location.pathname);
          const open = openGroup === entry.label;
          return (
            <Collapsible key={entry.label} open={open} onOpenChange={(v) => setOpenGroup(v ? entry.label : null)}>
              <CollapsibleTrigger asChild>
                <button className={cn(linkClass(groupActive && !open), "w-full justify-between")}>
                  <span className="flex items-center gap-3"><entry.icon className="h-4 w-4" />{entry.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 pt-1">
                {entry.items.map((item) => {
                  const active = isEntryActive(item, location.pathname);
                  return (
                    <Link key={item.href} to={item.href} className={cn(linkClass(active), "py-2 text-[13px]")}>
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </aside>
  );
}
