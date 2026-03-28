import { useEffect, useRef, useState } from "react";
import { BINANCE_SYMBOL_MAP } from "./useBinanceTicker";

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export function useBinanceOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const binanceSymbol = (
    BINANCE_SYMBOL_MAP[symbol] ?? symbol.replace("/", "")
  ).toLowerCase();

  useEffect(() => {
    mountedRef.current = true;
    setOrderBook({ bids: [], asks: [] });

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const connect = () => {
      if (!mountedRef.current) return;
      const url = `wss://stream.binance.com:9443/ws/${binanceSymbol}@depth20@100ms`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(evt.data as string);
          const bids: OrderBookLevel[] = (msg.bids as string[][])
            .slice(0, 12)
            .map(([p, q]: string[]) => ({
              price: Number.parseFloat(p),
              quantity: Number.parseFloat(q),
            }));
          const asks: OrderBookLevel[] = (msg.asks as string[][])
            .slice(0, 12)
            .map(([p, q]: string[]) => ({
              price: Number.parseFloat(p),
              quantity: Number.parseFloat(q),
            }));
          setOrderBook({ bids, asks });
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [binanceSymbol]);

  return orderBook;
}
