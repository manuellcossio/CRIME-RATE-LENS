import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  STATES, StateName, YEARS, MONTHS,
  getStateCrimeBreakdown, getMonthlyHeatmap,
} from "@/data/crimeData";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function StateDeepDive() {
  const [selectedState, setSelectedState] = useState<StateName>("Ciudad de México");

  const crimeBreakdown = useMemo(() => getStateCrimeBreakdown(selectedState), [selectedState]);
  const heatmapData = useMemo(() => getMonthlyHeatmap(selectedState), [selectedState]);

  // Build heatmap grid
  const heatmapGrid = useMemo(() => {
    const maxVal = Math.max(...heatmapData.map((d) => d.total), 1);
    return YEARS.map((year) => ({
      year,
      months: MONTHS.map((month, mi) => {
        const entry = heatmapData.find((d) => d.year === year && d.monthNum === mi + 1);
        return { month, total: entry?.total || 0, intensity: entry ? entry.total / maxVal : 0 };
      }),
    }));
  }, [heatmapData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* State Selector */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Análisis por Entidad Federativa</h2>
            <p className="text-xs text-muted-foreground mt-1">Seleccione una entidad para ver el desglose detallado</p>
          </div>
          <div className="sm:ml-auto w-full sm:w-64">
            <Select value={selectedState} onValueChange={(v) => setSelectedState(v as StateName)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-64">
                {STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Crime Breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Desglose por Tipo de Delito — {selectedState}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={crimeBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
            <XAxis dataKey="crime" stroke="hsl(215, 15%, 55%)" fontSize={10} angle={-20} textAnchor="end" height={60} />
            <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
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
            <Bar dataKey="total" fill="hsl(38, 90%, 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Heatmap */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Mapa de Calor Mensual — {selectedState}
        </h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-medium py-1 pr-3">Año</th>
                {MONTHS.map((m) => (
                  <th key={m} className="text-center text-muted-foreground font-medium py-1 px-1 min-w-[40px]">
                    {m.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapGrid.map((row) => (
                <tr key={row.year}>
                  <td className="text-muted-foreground font-mono py-1 pr-3">{row.year}</td>
                  {row.months.map((cell) => (
                    <td key={cell.month} className="py-1 px-1">
                      <div
                        className="h-7 rounded-sm flex items-center justify-center text-[9px] font-mono transition-colors"
                        style={{
                          backgroundColor: cell.total
                            ? `hsl(174, 60%, ${Math.max(15, 50 - cell.intensity * 35)}%)`
                            : "hsl(220, 20%, 14%)",
                          color: cell.intensity > 0.5 ? "hsl(210, 20%, 90%)" : "hsl(215, 15%, 55%)",
                        }}
                        title={`${cell.month} ${row.year}: ${cell.total.toLocaleString()}`}
                      >
                        {cell.total > 0 ? (cell.total / 1000).toFixed(1) : "–"}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Menor</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <div
                key={v}
                className="h-3 w-5 rounded-sm"
                style={{ backgroundColor: `hsl(174, 60%, ${Math.max(15, 50 - v * 35)}%)` }}
              />
            ))}
          </div>
          <span>Mayor</span>
          <span className="ml-2">(valores en miles)</span>
        </div>
      </div>
    </div>
  );
}
