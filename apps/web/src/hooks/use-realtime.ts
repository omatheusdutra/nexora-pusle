import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { REALTIME_EVENTS } from "@flowpay/shared";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3333";

export function useRealtimeInvalidation() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"]
    });

    const invalidateDashboard = () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["attendants"] });
      void queryClient.invalidateQueries({ queryKey: ["attendances"] });
    };

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    for (const event of REALTIME_EVENTS) {
      socket.on(event, invalidateDashboard);
    }

    return () => {
      for (const event of REALTIME_EVENTS) {
        socket.off(event, invalidateDashboard);
      }
      socket.disconnect();
    };
  }, [queryClient]);

  return connected;
}
