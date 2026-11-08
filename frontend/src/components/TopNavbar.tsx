import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { navFor, pageTitleFor } from "@/lib/navConfig";
import { NotificationBell } from "./NotificationBell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown, User, IdCard } from "lucide-react";

export function TopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, isAdmin, isAgent, signOut } = useAuth();
  const navItems = navFor(isAdmin, isAgent);
  const title = pageTitleFor(location.pathname, navItems);
  const displayName = profile?.full_name || "Utilisateur";
  const roleLabel = isAdmin ? "Admin" : roles.includes("agent") ? "Agent" : "Client";

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-6">
      <h1 className="text-lg font-semibold font-heading text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <NotificationBell iconClassName="text-foreground" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full pl-1 pr-2.5 py-1 hover:bg-muted transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-accent text-xs font-bold text-accent-foreground shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground max-w-[10rem] truncate">{displayName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs font-normal text-muted-foreground">{roleLabel}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profil")} className="gap-2">
              <User className="h-4 w-4" />Mon profil
            </DropdownMenuItem>
            {!isAdmin && !isAgent && (
              <DropdownMenuItem onClick={() => navigate("/digimarket")} className="gap-2">
                <IdCard className="h-4 w-4" />Devenir agent
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
