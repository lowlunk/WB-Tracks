import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ type: 'PING', message: 'Connected to WB-Tracks' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'PONG') {
          console.log("WebSocket connection confirmed:", data.message);
          return;
        }
        
        if (data.type === 'INVENTORY_UPDATED') {
          // Invalidate relevant queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activity'] });
          queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
          queryClient.invalidateQueries({ queryKey: ['/api/transactions/consumed'] });
          queryClient.invalidateQueries({ queryKey: ['/api/components'] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, [queryClient]);

  return wsRef.current;
}