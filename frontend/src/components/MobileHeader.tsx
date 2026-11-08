import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Package, LogOut, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { navFor, isNavGroup, pageTitleFor, type NavEntry } from "@/lib/navConfig";

function isEntryActive(entry: NavEntry, pathname: string): boolean {
  if (isNavGroup(entry)) return entry.items.some((i) => isEntryActive(i, pathname));
  return pathname === entry.href || (entry.href !== "/dashboard" && pathname.startsWith(entry.href));
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const location = useLocation();
  const { profile, isAdmin, isAgent, signOut } = useAuth();

  const navItems = navFor(isAdmin, isAgent);
  const displayName = profile?.full_name || "Utilisateur";
  const title = pageTitleFor(location.pathname, navItems);

  const linkClass = (active: boolean) => cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    active ? "bg-white/15 text-white" : "text-primary-foreground/70 hover:bg-white/10 hover:text-white"
  );

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-primary border-b border-primary-foreground/10">
      <div className="flex items-center justify-between px-4 h-14">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent shrink-0">
            <Package className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="font-bold font-heading text-primary-foreground truncate">{title}</span>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell iconClassName="text-primary-foreground" />
          <button onClick={() => setOpen(!open)} className="text-primary-foreground p-1">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="bg-primary border-t border-primary-foreground/10 px-4 py-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          {navItems.map((entry) => {
            if (!isNavGroup(entry)) {
              const active = isEntryActive(entry, location.pathname);
              return (
                <Link key={entry.href} to={entry.href} onClick={() => setOpen(false)} className={linkClass(active)}>
                  <entry.icon className="h-4 w-4" />
                  {entry.label}
                </Link>
              );
            }
            const groupActive = isEntryActive(entry, location.pathname);
            const isOpen = openGroup === entry.label || (openGroup === null && groupActive);
            return (
              <Collapsible key={entry.label} open={isOpen} onOpenChange={(v) => setOpenGroup(v ? entry.label : null)}>
                <CollapsibleTrigger asChild>
                  <button className={cn(linkClass(groupActive && !isOpen), "w-full justify-between")}>
                    <span className="flex items-center gap-3"><entry.icon className="h-4 w-4" />{entry.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 pt-1">
                  {entry.items.map((item) => {
                    const active = isEntryActive(item, location.pathname);
                    return (
                      <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className={cn(linkClass(active), "py-2 text-[13px]")}>
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          <div className="border-t border-primary-foreground/10 pt-3 mt-3 space-y-2">
            <p className="text-sm text-primary-foreground/70 px-3">{displayName}</p>
            <Link to="/profil" onClick={() => setOpen(false)} className={linkClass(location.pathname === "/profil")}>
              <User className="h-4 w-4" />Mon profil
            </Link>
            <button onClick={signOut} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/70 hover:bg-white/10 hover:text-white w-full">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
