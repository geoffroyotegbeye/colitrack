import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, Package, CheckCheck, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  triggerClassName?: string;
  iconClassName?: string;
}

export function NotificationBell({ triggerClassName, iconClassName }: Props) {
  const queryClient = useQueryClient();

  // Le push instantané est géré par NotificationSocket (WebSocket) ; ce polling n'est qu'un filet de sécurité
  // en cas de coupure de la connexion temps réel.
  const { data: unread } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => api.notifications.unreadCount(),
    refetchInterval: 60000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
    refetchInterval: 60000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: invalidate,
  });

  const count = unread?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("relative", triggerClassName)} title="Notifications">
          <Bell className={cn("h-5 w-5", iconClassName)} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <p className="font-semibold text-sm text-foreground">Notifications</p>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-3.5 w-3.5" />Tout marquer lu
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune notification</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                to={n.commande_id ? `/orders/${n.commande_id}` : "#"}
                onClick={() => !n.is_read && markRead.mutate(n.id)}
                className={cn("flex items-start gap-2.5 p-3 hover:bg-muted/50 transition-colors", !n.is_read && "bg-accent/5")}
              >
                <Package className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm truncate", !n.is_read ? "font-semibold text-foreground" : "text-muted-foreground")}>{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}</p>
                </div>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />}
              </Link>
            ))
          )}
        </div>
        <Link
          to="/notifications"
          className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-medium text-accent hover:bg-muted/50 transition-colors border-t border-border"
        >
          <ListChecks className="h-3.5 w-3.5" />Voir toutes les notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
