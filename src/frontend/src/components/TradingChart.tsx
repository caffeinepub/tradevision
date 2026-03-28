import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  LineSeries,
  LineStyle,
  type SeriesMarker,
  type UTCTimestamp,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { useBinanceKlines } from "../hooks/useBinanceKlines";
import { calcEMA, calcRSI } from "../utils/indicators";
import { detectSignals } from "../utils/signals";

const C = {
  bg: "#0D1117",
  grid: "#1F2A36",
  text: "#9AA7B5",
  upCandle: "#2BD67B",
  downCandle: "#FF5B5B",
  ema9: "#18C7B7",
  ema21: "#FFB800",
  rsiLine: "#A855F7",
  volUp: "rgba(43, 214, 123, 0.4)",
  volDown: "rgba(255, 91, 91, 0.4)",
  border: "#1F2A36",
};

type CandleSeriesApi = ISeriesApi<"Candlestick", UTCTimestamp>;
type LineSeriesApi = ISeriesApi<"Line", UTCTimestamp>;
type HistoSeriesApi = ISeriesApi<"Histogram", UTCTimestamp>;

interface ChartRefs {
  main: IChartApi;
  rsi: IChartApi;
  candle: CandleSeriesApi;
  ema9Series: LineSeriesApi;
  ema21Series: LineSeriesApi;
  volume: HistoSeriesApi;
  rsiSeries: LineSeriesApi;
  rsiOBSeries: LineSeriesApi;
  rsiOSSeries: LineSeriesApi;
  markersPlugin: ISeriesMarkersPluginApi<UTCTimestamp>;
}

interface Props {
  symbol: string;
  interval: string;
  showEMA: boolean;
  showRSI: boolean;
}

export default function TradingChart({
  symbol,
  interval,
  showEMA,
  showRSI,
}: Props) {
  const mainDivRef = useRef<HTMLDivElement>(null);
  const rsiDivRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<ChartRefs | null>(null);
  const syncingRef = useRef(false);

  const { candles, isLoading, error } = useBinanceKlines(symbol, interval);

  // Create charts on mount
  useEffect(() => {
    if (!mainDivRef.current || !rsiDivRef.current) return;

    const sharedLayout = {
      background: { type: ColorType.Solid, color: C.bg },
      textColor: C.text,
      fontSize: 11,
    };
    const sharedGrid = {
      vertLines: { color: C.grid },
      horzLines: { color: C.grid },
    };
    const sharedTimeScale = {
      borderColor: C.border,
      timeVisible: true,
      secondsVisible: false,
    };

    const main = createChart(mainDivRef.current, {
      layout: sharedLayout,
      grid: sharedGrid,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: C.border },
      timeScale: sharedTimeScale,
      handleScale: { axisPressedMouseMove: { time: true, price: true } },
      handleScroll: { pressedMouseMove: true, mouseWheel: true },
    });

    const rsiChart = createChart(rsiDivRef.current, {
      layout: sharedLayout,
      grid: sharedGrid,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: C.border,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: { ...sharedTimeScale, visible: false },
    });

    // Sync time scales
    main.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (syncingRef.current || !range) return;
      syncingRef.current = true;
      rsiChart.timeScale().setVisibleLogicalRange(range);
      syncingRef.current = false;
    });
    rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (syncingRef.current || !range) return;
      syncingRef.current = true;
      main.timeScale().setVisibleLogicalRange(range);
      syncingRef.current = false;
    });

    // Candlestick series
    const candle = main.addSeries(CandlestickSeries, {
      upColor: C.upCandle,
      downColor: C.downCandle,
      borderUpColor: C.upCandle,
      borderDownColor: C.downCandle,
      wickUpColor: C.upCandle,
      wickDownColor: C.downCandle,
    }) as CandleSeriesApi;

    // EMA lines
    const ema9Series = main.addSeries(LineSeries, {
      color: C.ema9,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
    }) as LineSeriesApi;
    const ema21Series = main.addSeries(LineSeries, {
      color: C.ema21,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
    }) as LineSeriesApi;

    // Volume
    const volume = main.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    }) as HistoSeriesApi;
    main.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // RSI
    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: C.rsiLine,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    }) as LineSeriesApi;
    const rsiOBSeries = rsiChart.addSeries(LineSeries, {
      color: "rgba(255, 91, 91, 0.6)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    }) as LineSeriesApi;
    const rsiOSSeries = rsiChart.addSeries(LineSeries, {
      color: "rgba(43, 214, 123, 0.6)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    }) as LineSeriesApi;

    // Markers plugin
    const markersPlugin = createSeriesMarkers(candle, []);

    chartsRef.current = {
      main,
      rsi: rsiChart,
      candle,
      ema9Series,
      ema21Series,
      volume,
      rsiSeries,
      rsiOBSeries,
      rsiOSSeries,
      markersPlugin,
    };

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (mainDivRef.current) {
        main.applyOptions({
          width: mainDivRef.current.clientWidth,
          height: mainDivRef.current.clientHeight,
        });
      }
      if (rsiDivRef.current) {
        rsiChart.applyOptions({
          width: rsiDivRef.current.clientWidth,
          height: rsiDivRef.current.clientHeight,
        });
      }
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      main.remove();
      rsiChart.remove();
      chartsRef.current = null;
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    const c = chartsRef.current;
    if (!c || candles.length === 0) return;

    const closes = candles.map((x) => x.close);
    const ema9 = calcEMA(closes, 9);
    const ema21 = calcEMA(closes, 21);
    const rsiValues = calcRSI(closes, 14);

    // Candles
    c.candle.setData(
      candles.map((k) => ({
        time: k.time as UTCTimestamp,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      })),
    );

    // Volume
    c.volume.setData(
      candles.map((k) => ({
        time: k.time as UTCTimestamp,
        value: k.volume,
        color: k.close >= k.open ? C.volUp : C.volDown,
      })),
    );

    // EMA lines
    c.ema9Series.applyOptions({ visible: showEMA });
    c.ema21Series.applyOptions({ visible: showEMA });
    if (showEMA) {
      c.ema9Series.setData(
        candles.map((k, i) => ({
          time: k.time as UTCTimestamp,
          value: ema9[i],
        })),
      );
      c.ema21Series.setData(
        candles.map((k, i) => ({
          time: k.time as UTCTimestamp,
          value: ema21[i],
        })),
      );
    }

    // RSI
    c.rsiSeries.applyOptions({ visible: showRSI });
    c.rsiOBSeries.applyOptions({ visible: showRSI });
    c.rsiOSSeries.applyOptions({ visible: showRSI });
    if (showRSI) {
      const rsiData = candles
        .map((k, i) => ({ time: k.time as UTCTimestamp, value: rsiValues[i] }))
        .filter((d) => !Number.isNaN(d.value));
      c.rsiSeries.setData(rsiData);

      if (rsiData.length >= 2) {
        const first = rsiData[0].time;
        const last = rsiData[rsiData.length - 1].time;
        c.rsiOBSeries.setData([
          { time: first, value: 70 },
          { time: last, value: 70 },
        ]);
        c.rsiOSSeries.setData([
          { time: first, value: 30 },
          { time: last, value: 30 },
        ]);
      }
    }

    // Signals / Markers
    const signals = detectSignals(
      candles.map((k) => ({
        time: k.time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      })),
      ema9,
      ema21,
      rsiValues,
    );

    const markers: SeriesMarker<UTCTimestamp>[] = signals.map((s) => ({
      time: s.time as UTCTimestamp,
      position: s.position,
      color: s.color,
      shape: s.shape,
      text: s.text,
      size: s.size,
    }));

    c.markersPlugin.setMarkers(markers);
  }, [candles, showEMA, showRSI]);

  // Scroll to latest on first load
  useEffect(() => {
    if (!isLoading && candles.length > 0 && chartsRef.current) {
      chartsRef.current.main.timeScale().scrollToRealTime();
    }
  }, [isLoading, candles.length]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col flex-1 overflow-hidden relative"
    >
      {/* Main chart */}
      <div ref={mainDivRef} className="flex-1 min-h-0" />

      {/* RSI pane */}
      <div
        ref={rsiDivRef}
        className="border-t border-border"
        style={{ height: showRSI ? "110px" : "0px", flexShrink: 0 }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div
          data-ocid="chart.loading_state"
          className="absolute inset-0 flex items-center justify-center bg-background/80 z-10"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground text-xs">
              Loading market data...
            </span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !isLoading && (
        <div
          data-ocid="chart.error_state"
          className="absolute inset-0 flex items-center justify-center bg-background/80 z-10"
        >
          <div className="text-center">
            <p className="text-sell text-sm font-medium">
              Failed to load chart data
            </p>
            <p className="text-muted-foreground text-xs mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
