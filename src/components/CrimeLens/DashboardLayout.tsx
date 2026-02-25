import { useState } from "react";
import { BarChart3, Map, Database, TrendingUp } from "lucide-react";
import { Overview } from "./Overview";
import { StateDeepDive } from "./StateDeepDive";
import { DataExplorer } from "./DataExplorer";
import { TrendsPage } from "./TrendsPage";

const TABS = [
  { id: "overview", label: "Panorama Nacional", icon: BarChart3 },
  { id: "states", label: "Análisis Estatal", icon: Map },
  { id: "trends", label: "Tendencias", icon: TrendingUp },
  { id: "data", label: "Explorador de Datos", icon: Database },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded gradient-teal flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">CrimeLens MX</h1>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Análisis de Seguridad Pública · SESNSP
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Datos actualizados · Oct 2024
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-border/30 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-thin">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "overview" && <Overview />}
        {activeTab === "states" && <StateDeepDive />}
        {activeTab === "trends" && <TrendsPage />}
        {activeTab === "data" && <DataExplorer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Fuente: Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública (SESNSP) · Datos simulados con fines analíticos
        </div>
      </footer>
    </div>
  );
}
