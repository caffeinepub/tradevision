import { useBinanceOrderBook } from "../hooks/useBinanceOrderBook";

interface Props {
  symbol: string;
}

export default function OrderBook({ symbol }: Props) {
  const { bids, asks } = useBinanceOrderBook(symbol);

  const maxQty = Math.max(
    ...bids.map((b) => b.quantity),
    ...asks.map((a) => a.quantity),
    1,
  );

  const formatPrice = (p: number) =>
    p.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const formatQty = (q: number) => (q < 1 ? q.toFixed(4) : q.toFixed(3));

  return (
    <section
      data-ocid="orderbook.panel"
      className="border-t border-border bg-card shrink-0"
      style={{ height: "180px" }}
    >
      <div className="flex items-center px-3 py-1.5 border-b border-border">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Order Book
        </span>
        <span className="ml-2 text-[10px] text-muted-foreground">{symbol}</span>
      </div>
      <div className="flex h-[calc(180px-30px)] overflow-hidden">
        {/* Bids */}
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between px-2 py-1 border-b border-border/50">
            <span className="text-[10px] text-muted-foreground">Bid</span>
            <span className="text-[10px] text-muted-foreground">Size</span>
          </div>
          <div
            data-ocid="orderbook.list"
            className="overflow-y-auto"
            style={{ height: "calc(100% - 26px)" }}
          >
            {bids.length === 0 ? (
              <div
                data-ocid="orderbook.empty_state"
                className="flex items-center justify-center h-8 text-xs text-muted-foreground"
              >
                Loading...
              </div>
            ) : (
              bids.slice(0, 10).map((bid, i) => {
                const fillPct = (bid.quantity / maxQty) * 100;
                return (
                  <div
                    key={bid.price}
                    data-ocid={`orderbook.row.${i + 1}`}
                    className="relative flex justify-between px-2 py-0.5 text-[11px]"
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-buy/10"
                      style={{ width: `${fillPct}%` }}
                    />
                    <span className="relative text-buy font-mono">
                      {formatPrice(bid.price)}
                    </span>
                    <span className="relative text-muted-foreground font-mono">
                      {formatQty(bid.quantity)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="w-px bg-border" />

        {/* Asks */}
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between px-2 py-1 border-b border-border/50">
            <span className="text-[10px] text-muted-foreground">Ask</span>
            <span className="text-[10px] text-muted-foreground">Size</span>
          </div>
          <div
            className="overflow-y-auto"
            style={{ height: "calc(100% - 26px)" }}
          >
            {asks.length === 0 ? (
              <div className="flex items-center justify-center h-8 text-xs text-muted-foreground">
                Loading...
              </div>
            ) : (
              asks.slice(0, 10).map((ask, i) => {
                const fillPct = (ask.quantity / maxQty) * 100;
                return (
                  <div
                    key={ask.price}
                    data-ocid={`orderbook.row.${i + 1}`}
                    className="relative flex justify-between px-2 py-0.5 text-[11px]"
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-sell/10"
                      style={{ width: `${fillPct}%` }}
                    />
                    <span className="relative text-sell font-mono">
                      {formatPrice(ask.price)}
                    </span>
                    <span className="relative text-muted-foreground font-mono">
                      {formatQty(ask.quantity)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
