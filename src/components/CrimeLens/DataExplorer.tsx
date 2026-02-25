import { useState, useMemo } from "react";
import { Download, Search } from "lucide-react";
import {
  STATES, CRIME_TYPES, YEARS, crimeData, getFilteredData,
  type StateName, type CrimeType,
} from "@/data/crimeData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function DataExplorer() {
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [crimeFilter, setCrimeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const filtered = useMemo(() => {
    let data = getFilteredData({
      states: stateFilter !== "all" ? [stateFilter as StateName] : undefined,
      crimeTypes: crimeFilter !== "all" ? [crimeFilter as CrimeType] : undefined,
      years: yearFilter !== "all" ? [Number(yearFilter)] : undefined,
    });
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) => r.entidad_federativa.toLowerCase().includes(q) || r.tipo_delito.toLowerCase().includes(q)
      );
    }
    return data;
  }, [stateFilter, crimeFilter, yearFilter, search]);

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const stats = useMemo(() => {
    const totals = filtered.map((r) => r.num_carpetas);
    const sum = totals.reduce((a, b) => a + b, 0);
    const mean = totals.length ? sum / totals.length : 0;
    const sorted = [...totals].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const max = sorted[sorted.length - 1] || 0;
    const min = sorted[0] || 0;
    return { count: filtered.length, sum, mean, median, max, min };
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["año", "mes", "entidad_federativa", "tipo_delito", "num_carpetas"];
    const rows = filtered.map((r) => [r.año, r.mes, r.entidad_federativa, r.tipo_delito, r.num_carpetas].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crimelens_mx_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estado o delito..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
              <SelectValue placeholder="Entidad" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-64">
              <SelectItem value="all">Todas las entidades</SelectItem>
              {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={crimeFilter} onValueChange={(v) => { setCrimeFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-44 bg-secondary border-border">
              <SelectValue placeholder="Delito" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todos los delitos</SelectItem>
              {CRIME_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-28 bg-secondary border-border">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todos</SelectItem>
              {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Registros", value: stats.count.toLocaleString() },
          { label: "Total Carpetas", value: stats.sum.toLocaleString() },
          { label: "Media", value: Math.round(stats.mean).toLocaleString() },
          { label: "Mediana", value: stats.median.toLocaleString() },
          { label: "Mínimo", value: stats.min.toLocaleString() },
          { label: "Máximo", value: stats.max.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Año</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Mes</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Entidad</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Tipo de Delito</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Carpetas</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/50 transition-colors">
                  <td className="p-3 font-mono">{r.año}</td>
                  <td className="p-3">{r.mes}</td>
                  <td className="p-3">{r.entidad_federativa}</td>
                  <td className="p-3">{r.tipo_delito}</td>
                  <td className="p-3 text-right font-mono">{r.num_carpetas.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              Mostrando {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} de {filtered.length.toLocaleString()}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="text-xs"
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
