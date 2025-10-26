// src/hooks/useStompBattery.jsx
import { useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Lấy base URL từ .env (http/https)
const HTTP_BASE =
  (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")) ||
  "http://localhost:8080";

export const useStompBattery = () => {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Kết nối qua SockJS tới /ws-battery (BE đang dùng .withSockJS())
  const connect = useCallback((headers = {}) => {
    if (clientRef.current?.active || clientRef.current?.connected) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${HTTP_BASE}/ws-battery`),
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: headers,
      onConnect: () => {
        console.log("✅ STOMP Connected");
        setConnected(true)}
        ,
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    clientRef.current = client;
  client.activate();
  }, []);

  const disconnect = useCallback(() => {
    const c = clientRef.current;
    if (!c) return;
    try { c.deactivate(); } catch {}
  }, []);

  const subscribeStation = useCallback((stationId, handler) => {
    const c = clientRef.current;
    if (!c || !c.connected) return () => {};
    const dest = `/topic/station-${stationId}`;
    const sub = c.subscribe(dest, (frame) => {
      const raw = frame.body;
      try { handler(JSON.parse(raw)); } catch { handler({ raw }); }
    });
    return () => sub?.unsubscribe?.();
  }, []);

  const subscribeAdmin = useCallback((handler) => {
    const c = clientRef.current;
    if (!c || !c.connected) return () => {};
    const dest = `/topic/admin`;
    const sub = c.subscribe(dest, (frame) => {
      const raw = frame.body;
      try { handler(JSON.parse(raw)); } catch { handler({ raw }); }
    });
    return () => sub?.unsubscribe?.();
  }, []);

  const subscribeStationGrouped = useCallback((stationId, handler) => {
    const c = clientRef.current;
    if (!c || !c.connected) return () => {};
    const dest = `/topic/station-${stationId}/grouped`;
    const sub = c.subscribe(dest, (frame) => {
      const raw = frame.body;
      try { handler(JSON.parse(raw)); } catch { handler({ raw }); }
    });
    return () => sub?.unsubscribe?.();
  }, []);

  const sendJoinStation = useCallback((stationId) => {
    const c = clientRef.current;
    if (!c || !c.connected) return;
    c.publish({ destination: "/app/joinStation", body: JSON.stringify({ stationId }) });
  }, []);

  return {
    connect,
    disconnect,
    subscribeStation,
    subscribeAdmin,
    subscribeStationGrouped,
    sendJoinStation,
    connected,
  };
};
