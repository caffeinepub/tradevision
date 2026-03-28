import { useEffect, useRef, useState } from "react";

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
}

export const BINANCE_SYMBOL_MAP: Record<string, string> = {
  "BTC/USDT": "BTCUSDT",
  "ETH/USDT": "ETHUSDT",
  "BNB/USDT": "BNBUSDT",
  "SOL/USDT": "SOLUSDT",
  "XAU/USD": "PAXGUSDT",
};

export function useBinanceTicker(assets: string[]) {
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  useEffect(() => {
    mountedRef.current = true;

    const streams = assetsRef.current
      .map((a) => BINANCE_SYMBOL_MAP[a])
      .filter(Boolean)
      .map((s) => `${s.toLowerCase()}@miniTicker`)
      .join("/");

    const connect = () => {
      if (!mountedRef.current) return;
      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(evt.data as string);
          const d = msg.data;
          if (!d || d.e !== "24hrMiniTicker") return;
          const price = Number.parseFloat(d.c);
          const open = Number.parseFloat(d.o);
          const change = open !== 0 ? ((price - open) / open) * 100 : 0;
          const pair = assetsRef.current.find(
            (a) => BINANCE_SYMBOL_MAP[a] === d.s,
          );
          if (pair) {
            setTickers((prev) => ({
              ...prev,
              [pair]: { symbol: pair, price, change },
            }));
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return tickers;
}
