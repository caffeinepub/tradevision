import {
  Activity,
  BarChart2,
  LineChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useBinanceTicker } from "../hooks/useBinanceTicker";

interface Props {
  assets: string[];
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
}

const ASSET_ICONS: Record<string, string> = {
  "BTC/USDT": "₿",
  "ETH/USDT": "Ξ",
  "BNB/USDT": "B",
  "SOL/USDT": "◎",
  "XAU/USD": "Au",
};

const ASSET_LABELS: Record<string, string> = {
  "XAU/USD": "Gold",
};

const TOOLS = [
  { icon: Activity, label: "RSI", desc: "Relative Strength" },
  { icon: BarChart2, label: "MACD", desc: "Momentum" },
  { icon: LineChart, label: "Bollinger", desc: "Volatility Bands" },
];

export default function Sidebar({
  assets,
  selectedAsset,
  onAssetChange,
}: Props) {
  const tickers = useBinanceTicker(assets);

  return (
    <aside
      data-ocid="sidebar.panel"
      className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col overflow-hidden"
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Markets
          </span>
        </div>
        <div
          data-ocid="sidebar.list"
          className="flex flex-col overflow-y-auto flex-1"
        >
          {assets.map((asset, idx) => {
            const ticker = tickers[asset];
            const price = ticker?.price ?? 0;
            const change = ticker?.change ?? 0;
            const isPos = change >= 0;
            const isSelected = asset === selectedAsset;
            const label = ASSET_LABELS[asset] ?? asset.split("/")[0];

            return (
              <button
                key={asset}
                type="button"
                data-ocid={`sidebar.item.${idx + 1}`}
                onClick={() => onAssetChange(asset)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                  isSelected
                    ? "bg-teal/10 border-l-2 border-teal"
                    : "border-l-2 border-transparent hover:bg-muted/50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected
                      ? "bg-teal/20 text-teal"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ASSET_ICONS[asset] ?? asset[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold text-xs ${isSelected ? "text-foreground" : "text-foreground/80"}`}
                    >
                      {label}
                    </span>
                    {price > 0 && (
                      <span
                        className={`text-xs font-mono font-medium ${isPos ? "text-buy" : "text-sell"}`}
                      >
                        {isPos ? (
                          <TrendingUp className="w-3 h-3 inline mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 inline mr-0.5" />
                        )}
                        {isPos ? "+" : ""}
                        {change.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    {price > 0
                      ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "Loading..."}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="px-3 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Indicators
          </span>
        </div>
        {TOOLS.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <Icon className="w-3.5 h-3.5 text-teal shrink-0" />
            <div>
              <div className="text-xs font-medium text-foreground/80">
                {label}
              </div>
              <div className="text-[10px] text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
