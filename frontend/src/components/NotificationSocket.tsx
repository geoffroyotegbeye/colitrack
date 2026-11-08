import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api";

/** Ouvre une connexion WebSocket persistante pour recevoir les notifications en temps réel.
 * Doit être monté une seule fois (pas dans un composant dupliqué mobile/desktop). */
export function NotificationSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const connect = () => {
      const token = getToken();
      if (!token || cancelled) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => { retryRef.current = 0; };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
          toast(notification.title, { description: notification.message });
        } catch {
          // payload inattendu, on ignore
        }
      };

      ws.onclose = (e) => {
        // 4001 = jeton refusé par le serveur : inutile de réessayer, on arrête la boucle.
        if (cancelled || e.code === 4001) return;
        const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
        retryRef.current += 1;
        timeoutRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      wsRef.current?.close();
    };
  }, [user, queryClient]);

  return null;
}
