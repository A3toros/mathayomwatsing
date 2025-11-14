import { useEffect, useRef, useState, useCallback } from 'react';

// Get WebSocket URL from env, ensure it ends with /ws
const getWebSocketUrl = () => {
  const envUrl = import.meta.env.VITE_WEBSOCKET_URL;
  if (envUrl) {
    // If env URL already includes /ws, use it as is
    if (envUrl.includes('/ws')) {
      return envUrl;
    }
    // Otherwise, append /ws
    return envUrl.endsWith('/') ? `${envUrl}ws` : `${envUrl}/ws`;
  }
  // Default fallback
  return 'wss://mini-game-socket.onrender.com/ws';
};

export function useMiniGameWebSocket(sessionCode, userId, userRole) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseBackoffDelay = 1000;
  const pingIntervalRef = useRef(null);
  const pongTimeoutRef = useRef(null);
  const messageHandlersRef = useRef(new Map());
  const connectRef = useRef(null);

  const startPinging = useCallback((ws) => {
    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));

        pongTimeoutRef.current = setTimeout(() => {
          console.log('No pong received, closing connection');
          ws.close(); // Browser WebSocket uses close(), not terminate()
        }, 10000);
      }
    }, 30000);
  }, []);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError('Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current++;
    const delay = Math.min(
      baseBackoffDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
      60000
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
    setTimeout(() => {
      if (connectRef.current) {
        connectRef.current();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (!sessionCode || !userId) {
      console.warn('[WebSocket] Cannot connect: missing sessionCode or userId', { sessionCode, userId });
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const baseUrl = getWebSocketUrl();
    const wsUrl = `${baseUrl}?session=${sessionCode}&userId=${userId}&role=${userRole || 'student'}`;
    console.log('[WebSocket] Connecting to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        startPinging(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] ========== RAW MESSAGE RECEIVED ==========');
          console.log('[WebSocket] Message type:', data.type);
          console.log('[WebSocket] Full message:', data);
          setLastMessage(data);
          
          // Handle ping/pong (server sends pong, not ping)
          if (data.type === 'pong') {
            clearTimeout(pongTimeoutRef.current);
            return;
          }

          // Call registered handlers
          const handlers = messageHandlersRef.current.get(data.type) || [];
          console.log(`[WebSocket] Found ${handlers.length} handlers for type: ${data.type}`);
          
          if (data.type === 'spell-cast') {
            console.log('[WebSocket] ========== SPELL-CAST MESSAGE DETECTED ==========');
            console.log('[WebSocket] Spell-cast data:', data);
            console.log('[WebSocket] Number of handlers:', handlers.length);
          }
          
          if (data.type === 'spell-hit') {
            console.log(`[WebSocket] Spell-hit message received:`, data);
            console.log(`[WebSocket] Found ${handlers.length} handlers for spell-hit`);
          }
          
          handlers.forEach((handler, index) => {
            try {
              console.log(`[WebSocket] Calling handler ${index + 1}/${handlers.length} for ${data.type}`);
              handler(data);
            } catch (error) {
              console.error(`[WebSocket] Error in handler ${index + 1} for ${data.type}:`, error);
            }
          });
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        const code = event.code;
        const reason = event.reason || 'No reason provided';
        const wasClean = event.wasClean;
        console.log(`WebSocket closed: code=${code}, reason=${reason}, wasClean=${wasClean}`);
        setIsConnected(false);
        cleanup();
        
        // Don't reconnect if it was a clean close or server shutdown
        // Also don't reconnect if it's a normal closure (1000) or going away (1001)
        if (code !== 1000 && code !== 1001 && !wasClean) {
          console.log('Connection closed unexpectedly, will attempt to reconnect');
          handleReconnect();
        } else {
          console.log('Connection closed cleanly, not reconnecting');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [sessionCode, userId, userRole, startPinging, handleReconnect]);

  // Store connect function in ref to avoid circular dependency
  connectRef.current = connect;

  const cleanup = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  };

      const sendMessage = useCallback((type, payload) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const message = { type, payload };
          console.log('[WebSocket] Sending message:', message);
          wsRef.current.send(JSON.stringify(message));
        } else {
          console.warn('[WebSocket] Not connected, cannot send message', {
            readyState: wsRef.current?.readyState,
            type,
            payload
          });
        }
      }, []);

  const onMessage = useCallback((messageType, handler) => {
    if (!messageHandlersRef.current.has(messageType)) {
      messageHandlersRef.current.set(messageType, []);
    }
    messageHandlersRef.current.get(messageType).push(handler);

    // Return cleanup function
    return () => {
      const handlers = messageHandlersRef.current.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    error,
    lastMessage,
    sendMessage,
    onMessage
  };
}

