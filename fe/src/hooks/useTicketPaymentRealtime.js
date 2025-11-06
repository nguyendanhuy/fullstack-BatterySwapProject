import { useRef, useCallback, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Lấy base URL từ .env (http/https)
const HTTP_BASE =
    (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')) ||
    'http://localhost:8080';

/**
 * Hook để lắng nghe realtime payment events cho ticket
 * Subscribe tới /topic/station-{stationId}/tickets
 * Nhận event: {ticketId, event: "PENALTY_PAID"}
 */
export const useTicketPaymentRealtime = (stationId, onPenaltyPaid) => {
    const clientRef = useRef(null);
    const onPenaltyPaidRef = useRef(onPenaltyPaid);
    const subscriptionRef = useRef(null);

    // Update ref when callback changes
    useEffect(() => {
        onPenaltyPaidRef.current = onPenaltyPaid;
    }, [onPenaltyPaid]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (clientRef.current?.connected) {
            console.log('✅ STOMP already connected');
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(`${HTTP_BASE}/ws-battery`),
            reconnectDelay: 2000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                console.log('✅ WebSocket connected for ticket payment realtime');
                subscribeToTicketEvents();
            },
            onDisconnect: () => {
                console.log('🔌 WebSocket disconnected');
            },
            onStompError: (frame) => {
                console.error('❌ STOMP Error:', frame);
            },
            onWebSocketClose: () => {
                console.log('🔌 WebSocket connection closed');
            },
        });

        clientRef.current = client;
        client.activate();
    }, []);

    // Subscribe to ticket events
    const subscribeToTicketEvents = useCallback(() => {
        const client = clientRef.current;
        if (!client?.connected) {
            console.warn('⚠️ Client not connected');
            return;
        }

        if (!stationId) {
            console.warn('⚠️ No stationId provided');
            return;
        }

        // Unsubscribe previous subscription if exists
        if (subscriptionRef.current) {
            console.log('🔄 Unsubscribing previous subscription');
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }

        const destination = `/topic/station-${stationId}/tickets`;
        console.log('🎧 Subscribing to:', destination);

        try {
            const subscription = client.subscribe(destination, (frame) => {
                console.log('📩 RAW MESSAGE RECEIVED:', frame.body);
                try {
                    const event = JSON.parse(frame.body);
                    console.log('📩 Ticket event parsed:', event);
                    console.log('📩 Event type:', event.event);
                    console.log('📩 Ticket ID:', event.ticketId);
                    console.log('📩 Current stationId:', stationId);
                    console.log('📩 Callback exists:', !!onPenaltyPaidRef.current);

                    if (event.event === 'PENALTY_PAID') {
                        console.log('✅ PENALTY_PAID event detected! TicketId:', event.ticketId);
                        if (onPenaltyPaidRef.current) {
                            console.log('🎯 Calling onPenaltyPaid callback...');
                            onPenaltyPaidRef.current(event.ticketId);
                            console.log('✅ onPenaltyPaid callback executed!');
                        } else {
                            console.warn('⚠️ onPenaltyPaid callback is null!');
                        }
                    } else {
                        console.log('📝 Other event type:', event.event);
                    }
                } catch (err) {
                    console.error('❌ Error parsing ticket event:', err, frame.body);
                }
            });

            subscriptionRef.current = subscription;
            console.log('✅ Subscription successful:', destination);
        } catch (err) {
            console.error('❌ Error subscribing:', err);
        }
    }, [stationId]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        const client = clientRef.current;
        if (!client) return;
        try {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            client.deactivate();
            console.log('✅ WebSocket deactivated');
        } catch (err) {
            console.error('❌ Error disconnecting:', err);
        }
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // Re-subscribe when stationId changes
    useEffect(() => {
        if (clientRef.current?.connected && stationId) {
            console.log('🔄 StationId changed, re-subscribing...', stationId);
            subscribeToTicketEvents();
        }
    }, [stationId, subscribeToTicketEvents]);

    return { isConnected: clientRef.current?.connected || false };
};
