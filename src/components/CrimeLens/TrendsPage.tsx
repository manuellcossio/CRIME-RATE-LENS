import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { getNationalMonthlyTrend, CRIME_TYPES, crimeData } from "@/data/crimeData";

// Simple linear regression
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTot = data.reduce((s, d) => s + (d.y - meanY) ** 2, 0);
  const ssRes = data.reduce((s, d) => s + (d.y - (slope * d.x + intercept)) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

export function TrendsPage() {
  const monthlyTrend = useMemo(() => getNationalMonthlyTrend(), []);

  const { projectionData, metrics } = useMemo(() => {
    const points = monthlyTrend.map((d, i) => ({ x: i, y: d.total }));
    const { slope, intercept, r2 } = linearRegression(points);

    const residuals = points.map((p) => p.y - (slope * p.x + intercept));
    const mae = residuals.reduce((s, r) => s + Math.abs(r), 0) / residuals.length;
    const rmse = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);
    const stdResidual = Math.sqrt(residuals.reduce((s, r) => s + (r - residuals.reduce((a, b) => a + b, 0) / residuals.length) ** 2, 0) / residuals.length);

    const lastIdx = points.length - 1;
    const lastPeriod = monthlyTrend[lastIdx];
    const projections = [];

    // Include last 12 months of actual + 12 months forecast
    const histStart = Math.max(0, monthlyTrend.length - 12);
    for (let i = histStart; i < monthlyTrend.length; i++) {
      projections.push({
        period: monthlyTrend[i].period,
        actual: monthlyTrend[i].total,
        forecast: null as number | null,
        upper: null as number | null,
        lower: null as number | null,
      });
    }

    let m = lastPeriod.month;
    let y = lastPeriod.year;
    for (let i = 1; i <= 12; i++) {
      m++;
      if (m > 12) { m = 1; y++; }
      const futureIdx = lastIdx + i;
      const predicted = slope * futureIdx + intercept;
      projections.push({
        period: `${y}-${String(m).padStart(2, "0")}`,
        actual: null,
        forecast: Math.round(predicted),
        upper: Math.round(predicted + 1.96 * stdResidual),
        lower: Math.round(Math.max(0, predicted - 1.96 * stdResidual)),
      });
    }

    return {
      projectionData: projections,
      metrics: { r2, mae: Math.round(mae), rmse: Math.round(rmse) },
    };
  }, [monthlyTrend]);

  // Crime type yearly breakdown
  const crimeTypeTrends = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    for (const crime of CRIME_TYPES) map.set(crime, new Map());
    for (const r of crimeData) {
      map.get(r.tipo_delito)!.set(r.año, (map.get(r.tipo_delito)!.get(r.año) || 0) + r.num_carpetas);
    }
    return Array.from(map.entries()).map(([crime, yearMap]) => {
      const years = Array.from(yearMap.entries()).sort(([a], [b]) => a - b);
      const lastTwo = years.slice(-2);
      const change = lastTwo.length === 2 ? ((lastTwo[1][1] - lastTwo[0][1]) / lastTwo[0][1]) * 100 : 0;
      return { crime, change, latest: lastTwo[lastTwo.length - 1]?.[1] || 0 };
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Model Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">R² Score</p>
          <p className="text-2xl font-bold font-mono text-primary mt-1">{metrics.r2.toFixed(4)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Coeficiente de determinación</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">MAE</p>
          <p className="text-2xl font-bold font-mono text-accent mt-1">{metrics.mae.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Error absoluto medio</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">RMSE</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.rmse.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Raíz del error cuadrático medio</p>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">Proyección Nacional — Próximos 12 Meses</h2>
        <p className="text-xs text-muted-foreground mb-4">Regresión lineal con intervalo de confianza al 95%</p>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
            <XAxis dataKey="period" stroke="hsl(215, 15%, 55%)" fontSize={10} angle={-45} textAnchor="end" height={50} />
            <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 25%, 13%)",
                border: "1px solid hsl(220, 20%, 20%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 20%, 90%)",
              }}
              formatter={(value: number | null) => value !== null ? value.toLocaleString() : "–"}
            />
            <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(174, 60%, 45%)" fillOpacity={0.1} />
            <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(220, 25%, 10%)" fillOpacity={1} />
            <Line type="monotone" dataKey="actual" stroke="hsl(174, 60%, 45%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="forecast" stroke="hsl(38, 90%, 55%)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-primary" /> Datos históricos
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-accent" style={{ borderTop: "2px dashed" }} /> Proyección
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm" style={{ backgroundColor: "hsl(174, 60%, 45%)", opacity: 0.15 }} /> IC 95%
          </div>
        </div>
      </div>

      {/* Crime Type Changes */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Variación Interanual por Tipo de Delito</h2>
        <div className="space-y-3">
          {crimeTypeTrends.map((item) => (
            <div key={item.crime} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{item.crime}</span>
              <div className="flex-1 h-6 bg-secondary rounded-sm overflow-hidden relative">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${Math.min(100, Math.abs(item.change) * 2)}%`,
                    backgroundColor: item.change > 0 ? "hsl(0, 72%, 50%)" : "hsl(174, 60%, 45%)",
                  }}
                />
              </div>
              <span className={`text-xs font-mono w-16 text-right ${item.change > 0 ? "text-destructive" : "text-primary"}`}>
                {item.change > 0 ? "+" : ""}{item.change.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
