import { useState } from "react";
import OrderBook from "./components/OrderBook";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import TradingChart from "./components/TradingChart";
import { useIsMobile } from "./hooks/use-mobile";
import { useBinanceKlines } from "./hooks/useBinanceKlines";

const ASSETS = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XAU/USD"];

const TIMEFRAME_MAP: Record<string, string> = {
  "1m": "1m",
  "5m": "5m",
  "1h": "1h",
  "1D": "1d",
};

interface AppInnerProps {
  selectedAsset: string;
  timeframe: string;
  showEMA: boolean;
  showRSI: boolean;
  onTimeframeChange: (tf: string) => void;
  onToggleEMA: () => void;
  onToggleRSI: () => void;
  onAssetChange: (a: string) => void;
}

function AppInner({
  selectedAsset,
  timeframe,
  showEMA,
  showRSI,
  onTimeframeChange,
  onToggleEMA,
  onToggleRSI,
  onAssetChange,
}: AppInnerProps) {
  const isMobile = useIsMobile();
  const interval = TIMEFRAME_MAP[timeframe] ?? "1m";
  const { livePrice, priceChange } = useBinanceKlines(selectedAsset, interval);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar
        selectedAsset={selectedAsset}
        livePrice={livePrice}
        priceChange={priceChange}
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        showEMA={showEMA}
        showRSI={showRSI}
        onToggleEMA={onToggleEMA}
        onToggleRSI={onToggleRSI}
      />

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <Sidebar
            assets={ASSETS}
            selectedAsset={selectedAsset}
            onAssetChange={onAssetChange}
          />
        )}

        <main className="flex flex-col flex-1 overflow-hidden">
          <TradingChart
            symbol={selectedAsset}
            interval={interval}
            showEMA={showEMA}
            showRSI={showRSI}
          />
          <OrderBook symbol={selectedAsset} />
        </main>
      </div>

      {isMobile && (
        <nav className="flex border-t border-border bg-card shrink-0">
          {ASSETS.map((asset, idx) => (
            <button
              key={asset}
              type="button"
              data-ocid={`asset.tab.${idx + 1}`}
              onClick={() => onAssetChange(asset)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                selectedAsset === asset
                  ? "text-teal bg-teal/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {asset === "XAU/USD" ? "Gold" : asset.split("/")[0]}
            </button>
          ))}
        </nav>
      )}

      <footer className="hidden sm:flex items-center justify-center py-1 border-t border-border bg-card text-[10px] text-muted-foreground shrink-0">
        &copy; {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 hover:text-teal transition-colors"
        >
          Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(true);

  return (
    <AppInner
      selectedAsset={selectedAsset}
      timeframe={timeframe}
      showEMA={showEMA}
      showRSI={showRSI}
      onTimeframeChange={setTimeframe}
      onToggleEMA={() => setShowEMA((v) => !v)}
      onToggleRSI={() => setShowRSI((v) => !v)}
      onAssetChange={setSelectedAsset}
    />
  );
}
