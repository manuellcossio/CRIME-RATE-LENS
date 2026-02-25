export const STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila",
  "Colima", "Durango", "Estado de México", "Guanajuato",
  "Guerrero", "Hidalgo", "Jalisco", "Michoacán",
  "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas",
  "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
] as const;

export type StateName = (typeof STATES)[number];

export const CRIME_TYPES = [
  "Homicidio doloso",
  "Robo con violencia",
  "Extorsión",
  "Secuestro",
  "Feminicidio",
  "Narcomenudeo",
] as const;

export type CrimeType = (typeof CRIME_TYPES)[number];

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024] as const;

export interface CrimeRecord {
  año: number;
  mes: string;
  mesNum: number;
  entidad_federativa: StateName;
  tipo_delito: CrimeType;
  num_carpetas: number;
}

// Deterministic seeded random for reproducible data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Base rates per crime type (monthly per state, roughly)
const BASE_RATES: Record<CrimeType, number> = {
  "Homicidio doloso": 85,
  "Robo con violencia": 320,
  "Extorsión": 45,
  "Secuestro": 12,
  "Feminicidio": 8,
  "Narcomenudeo": 180,
};

// State danger multipliers (higher = more crime)
const STATE_MULTIPLIERS: Record<StateName, number> = {
  "Aguascalientes": 0.4, "Baja California": 1.5, "Baja California Sur": 0.5,
  "Campeche": 0.3, "Chiapas": 0.6, "Chihuahua": 1.6,
  "Ciudad de México": 2.2, "Coahuila": 0.8, "Colima": 1.8,
  "Durango": 0.6, "Estado de México": 2.5, "Guanajuato": 1.9,
  "Guerrero": 1.7, "Hidalgo": 0.5, "Jalisco": 1.8,
  "Michoacán": 1.4, "Morelos": 0.9, "Nayarit": 0.7,
  "Nuevo León": 1.3, "Oaxaca": 0.7, "Puebla": 1.0,
  "Querétaro": 0.5, "Quintana Roo": 0.8, "San Luis Potosí": 0.7,
  "Sinaloa": 1.2, "Sonora": 1.1, "Tabasco": 1.0,
  "Tamaulipas": 1.3, "Tlaxcala": 0.3, "Veracruz": 1.1,
  "Yucatán": 0.2, "Zacatecas": 1.0,
};

// Year trend multipliers (crime generally peaked around 2019-2020)
const YEAR_TRENDS: Record<number, number> = {
  2018: 0.92, 2019: 1.05, 2020: 0.88,
  2021: 0.95, 2022: 1.02, 2023: 1.08, 2024: 1.04,
};

// Month seasonality
const MONTH_SEASONALITY = [
  0.95, 0.90, 0.98, 1.0, 1.05, 1.08,
  1.10, 1.05, 0.98, 1.02, 0.95, 1.12,
];

function generateCrimeData(): CrimeRecord[] {
  const rng = seededRandom(42);
  const records: CrimeRecord[] = [];

  for (const year of YEARS) {
    for (let m = 0; m < 12; m++) {
      if (year === 2024 && m > 9) continue; // 2024 data up to October
      for (const state of STATES) {
        for (const crime of CRIME_TYPES) {
          const base = BASE_RATES[crime];
          const stateMult = STATE_MULTIPLIERS[state];
          const yearMult = YEAR_TRENDS[year];
          const monthMult = MONTH_SEASONALITY[m];
          const noise = 0.7 + rng() * 0.6;

          const value = Math.round(base * stateMult * yearMult * monthMult * noise);
          records.push({
            año: year,
            mes: MONTHS[m],
            mesNum: m + 1,
            entidad_federativa: state,
            tipo_delito: crime,
            num_carpetas: Math.max(0, value),
          });
        }
      }
    }
  }

  return records;
}

export const crimeData: CrimeRecord[] = generateCrimeData();

// Aggregation helpers
export function getTotalByYear(): { year: number; total: number }[] {
  const map = new Map<number, number>();
  for (const r of crimeData) {
    map.set(r.año, (map.get(r.año) || 0) + r.num_carpetas);
  }
  return Array.from(map.entries())
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => a.year - b.year);
}

export function getTrendByCrimeType(): { year: number; [key: string]: number }[] {
  const map = new Map<number, Record<string, number>>();
  for (const r of crimeData) {
    if (!map.has(r.año)) map.set(r.año, {});
    const entry = map.get(r.año)!;
    entry[r.tipo_delito] = (entry[r.tipo_delito] || 0) + r.num_carpetas;
  }
  return Array.from(map.entries())
    .map(([year, crimes]) => ({ year, ...crimes }))
    .sort((a, b) => a.year - b.year);
}

export function getStateRanking(): { state: StateName; total: number }[] {
  const map = new Map<StateName, number>();
  for (const r of crimeData) {
    map.set(r.entidad_federativa, (map.get(r.entidad_federativa) || 0) + r.num_carpetas);
  }
  return Array.from(map.entries())
    .map(([state, total]) => ({ state, total }))
    .sort((a, b) => b.total - a.total);
}

export function getStateCrimeBreakdown(state: StateName): { crime: string; total: number }[] {
  const map = new Map<string, number>();
  for (const r of crimeData) {
    if (r.entidad_federativa !== state) continue;
    map.set(r.tipo_delito, (map.get(r.tipo_delito) || 0) + r.num_carpetas);
  }
  return Array.from(map.entries())
    .map(([crime, total]) => ({ crime, total }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyHeatmap(state: StateName): { year: number; month: string; monthNum: number; total: number }[] {
  const map = new Map<string, number>();
  for (const r of crimeData) {
    if (r.entidad_federativa !== state) continue;
    const key = `${r.año}-${r.mesNum}`;
    map.set(key, (map.get(key) || 0) + r.num_carpetas);
  }
  return Array.from(map.entries())
    .map(([key, total]) => {
      const [y, m] = key.split("-").map(Number);
      return { year: y, month: MONTHS[m - 1], monthNum: m, total };
    })
    .sort((a, b) => a.year - b.year || a.monthNum - b.monthNum);
}

export function getFilteredData(filters: {
  years?: number[];
  states?: StateName[];
  crimeTypes?: CrimeType[];
}): CrimeRecord[] {
  return crimeData.filter((r) => {
    if (filters.years?.length && !filters.years.includes(r.año)) return false;
    if (filters.states?.length && !filters.states.includes(r.entidad_federativa)) return false;
    if (filters.crimeTypes?.length && !filters.crimeTypes.includes(r.tipo_delito)) return false;
    return true;
  });
}

export function getNationalMonthlyTrend(): { period: string; total: number; year: number; month: number }[] {
  const map = new Map<string, { total: number; year: number; month: number }>();
  for (const r of crimeData) {
    const key = `${r.año}-${String(r.mesNum).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, { total: 0, year: r.año, month: r.mesNum });
    map.get(key)!.total += r.num_carpetas;
  }
  return Array.from(map.entries())
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
