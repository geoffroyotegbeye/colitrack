import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, CheckCheck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { TablePagination } from "@/components/TablePagination";

const PAGE_SIZE = 20;

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [unreadOnly]);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-page", unreadOnly, page],
    queryFn: () => api.notifications.listPaginated({ unread: unreadOnly, page, limit: PAGE_SIZE }),
  });
  const notifications = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">{total} notification(s)</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" />Tout marquer lu
          </Button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setUnreadOnly(false)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium", !unreadOnly ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}
          >
            Toutes
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium", unreadOnly ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}
          >
            Non lues
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucune notification</p>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl border border-border shadow-card divide-y divide-border overflow-hidden">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.commande_id ? `/orders/${n.commande_id}` : "#"}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                  className={cn("flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors", !n.is_read && "bg-accent/5")}
                >
                  <Package className="h-4 w-4 text-accent shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !n.is_read ? "font-semibold text-foreground" : "text-muted-foreground")}>{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}</p>
                  </div>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                </Link>
              ))}
            </div>
            <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="notification(s)" />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
