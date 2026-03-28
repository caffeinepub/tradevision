export interface SignalMarker {
  time: number; // Unix seconds
  position: "aboveBar" | "belowBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text: string;
  size: number;
}

export interface CandleForSignal {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function detectSignals(
  candles: CandleForSignal[],
  ema9: number[],
  ema21: number[],
  rsi: number[],
): SignalMarker[] {
  const markers: SignalMarker[] = [];

  const minLen = Math.min(
    candles.length,
    ema9.length,
    ema21.length,
    rsi.length,
  );
  if (minLen < 2) return markers;

  const timeSet = new Set<number>();

  for (let i = 1; i < minLen; i++) {
    const candle = candles[i];
    const time = candle.time;

    const prevE9 = ema9[i - 1];
    const prevE21 = ema21[i - 1];
    const currE9 = ema9[i];
    const currE21 = ema21[i];

    // Golden cross: EMA9 crosses above EMA21 -> BUY
    if (prevE9 <= prevE21 && currE9 > currE21 && !timeSet.has(time)) {
      markers.push({
        time,
        position: "belowBar",
        color: "#2BD67B",
        shape: "arrowUp",
        text: "BUY",
        size: 1,
      });
      timeSet.add(time);
      continue;
    }

    // Death cross: EMA9 crosses below EMA21 -> SELL
    if (prevE9 >= prevE21 && currE9 < currE21 && !timeSet.has(time)) {
      markers.push({
        time,
        position: "aboveBar",
        color: "#FF5B5B",
        shape: "arrowDown",
        text: "SELL",
        size: 1,
      });
      timeSet.add(time);
      continue;
    }

    // RSI signals
    const rsiVal = rsi[i];
    const prevRsi = rsi[i - 1];
    if (Number.isNaN(rsiVal) || Number.isNaN(prevRsi)) continue;

    // RSI oversold: crossing below 30 -> BUY
    if (rsiVal < 30 && prevRsi >= 30 && !timeSet.has(time)) {
      markers.push({
        time,
        position: "belowBar",
        color: "#2BD67B",
        shape: "arrowUp",
        text: "BUY",
        size: 1,
      });
      timeSet.add(time);
      continue;
    }

    // RSI overbought: crossing above 70 -> SELL
    if (rsiVal > 70 && prevRsi <= 70 && !timeSet.has(time)) {
      markers.push({
        time,
        position: "aboveBar",
        color: "#FF5B5B",
        shape: "arrowDown",
        text: "SELL",
        size: 1,
      });
      timeSet.add(time);
    }
  }

  markers.sort((a, b) => a.time - b.time);
  return markers;
}
