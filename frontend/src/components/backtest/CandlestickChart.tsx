import React, { useEffect, useState } from "react";

// Interface for the OHLC data
export interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: MarketData[];
  title?: string;
  showVolume?: boolean;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  title = "Price Chart",
  showVolume = true,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [sortedData, setSortedData] = useState<MarketData[]>([]);
  const [chartDimensions, setChartDimensions] = useState({
    minPrice: 0,
    maxPrice: 0,
    priceRange: 0,
  });

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Process and sort the data
  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      // Sort data by date
      const sorted = [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setSortedData(sorted);

      // Calculate chart dimensions
      const prices = sorted.flatMap((item) => [item.high, item.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const padding = (maxPrice - minPrice) * 0.1; // 10% padding

      setChartDimensions({
        minPrice: minPrice - padding,
        maxPrice: maxPrice + padding,
        priceRange: maxPrice - minPrice + padding * 2,
      });
    } catch (error) {
      console.error("Error processing candlestick data:", error);
    }
  }, [data]);

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center dark:text-dark-text">
        No price data available for candlestick chart
      </div>
    );
  }

  // Calculate rendering properties
  const svgWidth = 100; // Using 100% to make it responsive
  const svgHeight = 95; // 95% height to leave room for labels
  const candleWidth = (svgWidth / sortedData.length) * 0.7; // Make candles 70% of available width
  const candleMargin = ((svgWidth / sortedData.length) * 0.3) / 2; // Equal margins on each side

  const getYPosition = (price: number) => {
    // Invert the y position because SVG coordinates start from top-left
    return (
      svgHeight -
      ((price - chartDimensions.minPrice) / chartDimensions.priceRange) *
        svgHeight
    );
  };

  // Create price labels for y-axis (5 divisions)
  const priceLabels = [];
  for (let i = 0; i <= 5; i++) {
    const price =
      chartDimensions.minPrice + (chartDimensions.priceRange * i) / 5;
    priceLabels.push({
      price,
      position: getYPosition(price),
    });
  }

  // Create date labels for the x-axis (show 5 evenly spaced dates)
  const dateLabels = [];
  for (let i = 0; i < 5; i++) {
    const index = Math.floor((i * (sortedData.length - 1)) / 4);
    if (index >= 0 && index < sortedData.length) {
      const date = new Date(sortedData[index].date);
      dateLabels.push({
        text: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        position: index * (svgWidth / (sortedData.length - 1)),
      });
    }
  }

  return (
    <div className="h-96 w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-2 text-center dark:text-white">
        {title}
      </h3>

      <div className="relative h-[90%] w-full">
        {/* Y-axis price labels */}
        <div className="absolute right-0 h-full pr-2" style={{ width: "60px" }}>
          {priceLabels.map((label, i) => (
            <div
              key={i}
              className="absolute text-xs dark:text-gray-300"
              style={{
                top: `${label.position}%`,
                right: "0",
                transform: "translateY(-50%)",
              }}
            >
              ${label.price.toFixed(2)}
            </div>
          ))}
        </div>

        {/* X-axis date labels */}
        <div className="absolute bottom-0 w-full h-8">
          {dateLabels.map((label, i) => (
            <div
              key={i}
              className="absolute text-xs dark:text-gray-300 transform -translate-x-1/2"
              style={{ left: `${label.position}%`, bottom: "0" }}
            >
              {label.text}
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <svg
          className="absolute left-0 top-0 w-[calc(100%-60px)] h-full"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          {/* Horizontal grid lines */}
          {priceLabels.map((label, i) => (
            <line
              key={i}
              x1="0"
              y1={`${label.position}`}
              x2={svgWidth}
              y2={`${label.position}`}
              stroke={
                isDarkMode ? "rgba(100, 116, 139, 0.2)" : "rgba(0, 0, 0, 0.1)"
              }
              strokeWidth="0.2"
            />
          ))}

          {/* Candlesticks */}
          {sortedData.map((item, index) => {
            const isUp = item.close >= item.open;
            const candleColor = isUp
              ? isDarkMode
                ? "rgba(34, 197, 94, 0.9)"
                : "rgba(22, 163, 74, 0.9)"
              : isDarkMode
              ? "rgba(239, 68, 68, 0.9)"
              : "rgba(220, 38, 38, 0.9)";

            const x = index * (svgWidth / (sortedData.length - 1));
            const candleX = x - candleWidth / 2;

            const openY = getYPosition(item.open);
            const closeY = getYPosition(item.close);
            const highY = getYPosition(item.high);
            const lowY = getYPosition(item.low);

            const candleTop = Math.min(openY, closeY);
            const candleHeight = Math.abs(closeY - openY) || 0.5; // Minimum height of 0.5 if open = close

            return (
              <g key={index}>
                {/* Wick (high to low line) */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="0.5"
                />

                {/* Candle body */}
                <rect
                  x={candleX}
                  y={candleTop}
                  width={candleWidth}
                  height={candleHeight || 0.5}
                  fill={candleColor}
                  stroke={
                    isDarkMode
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                  strokeWidth="0.1"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default CandlestickChart;
