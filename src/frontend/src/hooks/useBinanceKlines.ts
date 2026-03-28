import { useEffect, useRef, useState } from "react";
import { BINANCE_SYMBOL_MAP } from "./useBinanceTicker";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function parseRestKlines(data: string[][]): Candle[] {
  return data.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: Number.parseFloat(k[1]),
    high: Number.parseFloat(k[2]),
    low: Number.parseFloat(k[3]),
    close: Number.parseFloat(k[4]),
    volume: Number.parseFloat(k[5]),
  }));
}

function toBinanceSymbol(symbol: string): string {
  return BINANCE_SYMBOL_MAP[symbol] ?? symbol.replace("/", "").toUpperCase();
}

export function useBinanceKlines(symbol: string, interval: string) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const binanceSymbol = toBinanceSymbol(symbol);

  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    setError(null);
    setCandles([]);

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectRef.current) clearTimeout(reconnectRef.current);

    let cancelled = false;

    const connectWS = () => {
      if (!mountedRef.current || cancelled) return;
      const url = `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_${interval}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(evt.data as string);
          const k = msg.k;
          const newCandle: Candle = {
            time: Math.floor(k.t / 1000),
            open: Number.parseFloat(k.o),
            high: Number.parseFloat(k.h),
            low: Number.parseFloat(k.l),
            close: Number.parseFloat(k.c),
            volume: Number.parseFloat(k.v),
          };
          setCandles((prev) => {
            if (prev.length === 0) return [newCandle];
            const last = prev[prev.length - 1];
            if (last.time === newCandle.time)
              return [...prev.slice(0, -1), newCandle];
            if (newCandle.time > last.time) return [...prev, newCandle];
            return prev;
          });
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current || cancelled) return;
        reconnectRef.current = setTimeout(connectWS, 3000);
      };

      ws.onerror = () => ws.close();
    };

    const fetchHistorical = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: string[][] = await res.json();
        if (cancelled) return;
        setCandles(parseRestKlines(data));
        setIsLoading(false);
        connectWS();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load candles",
          );
          setIsLoading(false);
          connectWS();
        }
      }
    };

    fetchHistorical();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [binanceSymbol, interval]);

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles.length > 1 ? candles[0] : null;
  const livePrice = lastCandle?.close ?? 0;
  const priceChange =
    firstCandle && lastCandle
      ? ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100
      : 0;

  return { candles, isLoading, error, livePrice, priceChange };
}
