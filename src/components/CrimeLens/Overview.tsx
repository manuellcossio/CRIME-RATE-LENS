import { useMemo } from "react";
import { Shield, AlertTriangle, MapPin, Crosshair } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { KPICard } from "./KPICard";
import {
  getTotalByYear, getTrendByCrimeType, getStateRanking, CRIME_TYPES,
} from "@/data/crimeData";

const CHART_COLORS = [
  "hsl(174, 60%, 45%)",
  "hsl(38, 90%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(340, 65%, 55%)",
  "hsl(150, 50%, 45%)",
  "hsl(270, 50%, 55%)",
];

export function Overview() {
  const yearlyTotals = useMemo(() => getTotalByYear(), []);
  const trendData = useMemo(() => getTrendByCrimeType(), []);
  const stateRanking = useMemo(() => getStateRanking(), []);

  const latestYear = yearlyTotals[yearlyTotals.length - 1];
  const prevYear = yearlyTotals[yearlyTotals.length - 2];
  const yoyChange = prevYear ? ((latestYear.total - prevYear.total) / prevYear.total) * 100 : 0;
  const topState = stateRanking[0];
  const topCrime = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of trendData) {
      for (const crime of CRIME_TYPES) {
        map.set(crime, (map.get(crime) || 0) + ((row[crime] as number) || 0));
      }
    }
    let max = { crime: "", total: 0 };
    map.forEach((v, k) => { if (v > max.total) max = { crime: k, total: v }; });
    return max;
  }, [trendData]);

  const topStates = stateRanking.slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Carpetas 2024"
          value={latestYear.total}
          subtitle="Enero – Octubre"
          change={yoyChange}
          icon={<Shield className="h-5 w-5" />}
          variant="teal"
        />
        <KPICard
          title="Variación Anual"
          value={`${yoyChange > 0 ? "+" : ""}${yoyChange.toFixed(1)}%`}
          subtitle="vs. 2023"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={yoyChange > 0 ? "danger" : "teal"}
        />
        <KPICard
          title="Entidad Más Afectada"
          value={topState.state}
          subtitle={`${topState.total.toLocaleString()} carpetas (2018-2024)`}
          icon={<MapPin className="h-5 w-5" />}
          variant="amber"
        />
        <KPICard
          title="Delito Predominante"
          value={topCrime.crime}
          subtitle={`${topCrime.total.toLocaleString()} carpetas totales`}
          icon={<Crosshair className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Trend Chart */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Tendencia Nacional por Tipo de Delito (2018–2024)</h2>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
            <XAxis dataKey="year" stroke="hsl(215, 15%, 55%)" fontSize={12} />
            <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 25%, 13%)",
                border: "1px solid hsl(220, 20%, 20%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 20%, 90%)",
              }}
              formatter={(value: number) => value.toLocaleString()}
            />
            {CRIME_TYPES.map((crime, i) => (
              <Line
                key={crime}
                type="monotone"
                dataKey={crime}
                stroke={CHART_COLORS[i]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-4">
          {CRIME_TYPES.map((crime, i) => (
            <div key={crime} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
              {crime}
            </div>
          ))}
        </div>
      </div>

      {/* State Ranking */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Top 10 Entidades por Total de Carpetas (2018–2024)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topStates} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" horizontal={false} />
            <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="state" stroke="hsl(215, 15%, 55%)" fontSize={11} width={130} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 25%, 13%)",
                border: "1px solid hsl(220, 20%, 20%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 20%, 90%)",
              }}
              formatter={(value: number) => value.toLocaleString()}
            />
            <Bar dataKey="total" fill="hsl(174, 60%, 45%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
