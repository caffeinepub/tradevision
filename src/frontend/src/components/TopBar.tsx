import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Bell,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const TIMEFRAMES = ["1m", "5m", "1h", "1D"];

interface Props {
  selectedAsset: string;
  livePrice: number;
  priceChange: number;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  showEMA: boolean;
  showRSI: boolean;
  onToggleEMA: () => void;
  onToggleRSI: () => void;
}

export default function TopBar({
  selectedAsset,
  livePrice,
  priceChange,
  timeframe,
  onTimeframeChange,
  showEMA,
  showRSI,
  onToggleEMA,
  onToggleRSI,
}: Props) {
  const isPositive = priceChange >= 0;
  const formattedPrice =
    livePrice > 0
      ? livePrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "--";
  const formattedChange =
    priceChange !== 0
      ? `${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`
      : "--";

  return (
    <header
      data-ocid="topbar.panel"
      className="flex items-center justify-between px-3 sm:px-4 h-12 border-b border-border bg-card shrink-0 z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-teal/20">
          <Activity className="w-4 h-4 text-teal" />
        </div>
        <span className="font-bold text-sm tracking-wide text-foreground hidden sm:block">
          TradeVision
        </span>
      </div>

      {/* Center: Asset + Price */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
          <span className="font-bold text-xs sm:text-sm text-foreground">
            {selectedAsset}
          </span>
          {livePrice > 0 && (
            <>
              <span className="text-foreground font-mono font-semibold text-xs sm:text-sm">
                ${formattedPrice}
              </span>
              <Badge
                className={`text-xs px-1.5 py-0 ${
                  isPositive
                    ? "bg-buy/15 text-buy border-buy/30"
                    : "bg-sell/15 text-sell border-sell/30"
                }`}
                variant="outline"
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                )}
                {formattedChange}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Right: Timeframes + Toggles */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Timeframes */}
        <div className="flex items-center gap-0.5 mr-1 sm:mr-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              data-ocid="topbar.tab"
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                timeframe === tf
                  ? "bg-teal/20 text-teal border border-teal/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* EMA toggle */}
        <button
          type="button"
          data-ocid="topbar.toggle"
          onClick={onToggleEMA}
          title="Toggle EMA"
          className={`px-2 py-1 text-xs rounded font-medium border transition-all ${
            showEMA
              ? "bg-[#18C7B7]/15 text-[#18C7B7] border-[#18C7B7]/40"
              : "text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          EMA
        </button>

        {/* RSI toggle */}
        <button
          type="button"
          data-ocid="topbar.toggle"
          onClick={onToggleRSI}
          title="Toggle RSI"
          className={`px-2 py-1 text-xs rounded font-medium border transition-all ${
            showRSI
              ? "bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/40"
              : "text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          RSI
        </button>

        <button
          type="button"
          data-ocid="topbar.button"
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button
          type="button"
          data-ocid="topbar.button"
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
