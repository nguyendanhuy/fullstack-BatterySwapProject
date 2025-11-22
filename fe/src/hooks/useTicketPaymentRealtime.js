import { useRef, useCallback, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const HTTP_BASE = import.meta.env.VITE_API_BASE_URL;

export const useTicketPaymentRealtime = (stationId, onPenaltyPaid) => {
    const clientRef = useRef(null);
    const onPenaltyPaidRef = useRef(onPenaltyPaid);
    const subscriptionRef = useRef(null);


    useEffect(() => {
        onPenaltyPaidRef.current = onPenaltyPaid;
    }, [onPenaltyPaid]);

    const connect = useCallback(() => {
        console.log('🔌 Attempting to connect to Ticket Payment WebSocket...', HTTP_BASE);
        if (clientRef.current?.connected) {
            console.log('⚠️ Already connected, skipping...');
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(`${HTTP_BASE}/ws-battery`),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                console.log('✅ Ticket Payment WebSocket Connected');
                subscribeToTicketEvents();
            },
            onDisconnect: () => console.log('⚠️ Ticket Payment WebSocket Disconnected'),
            onStompError: (frame) => console.error('❌ STOMP Error:', frame),
            onWebSocketError: (error) => console.error('❌ WebSocket Error - Backend may not be available:', error),
        });

        clientRef.current = client;
        client.activate();
    }, []);

    const subscribeToTicketEvents = useCallback(() => {
        const client = clientRef.current;
        if (!client?.connected || !stationId) return;

        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }

        const destination = `/topic/station-${stationId}/tickets`;

        try {
            const subscription = client.subscribe(destination, (frame) => {
                console.log('📩 Event received:', frame.body);
                try {
                    const event = JSON.parse(frame.body);

                    if (event.event === 'PENALTY_PAID' && onPenaltyPaidRef.current) {
                        console.log('✅ PENALTY_PAID for Ticket #' + event.ticketId);
                        onPenaltyPaidRef.current(event.ticketId);
                    }
                } catch (err) {
                    console.error('❌ Error parsing event:', err);
                }
            });

            subscriptionRef.current = subscription;
        } catch (err) {
            console.error('❌ Error subscribing:', err);
        }
    }, [stationId]);

    const disconnect = useCallback(() => {
        const client = clientRef.current;
        if (!client) return;

        try {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            client.deactivate();
        } catch (err) {
            console.error('❌ Error disconnecting:', err);
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    useEffect(() => {
        if (clientRef.current?.connected && stationId) {
            subscribeToTicketEvents();
        }
    }, [stationId, subscribeToTicketEvents]);

    return { isConnected: clientRef.current?.connected || false };
};