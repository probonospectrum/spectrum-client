import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  OccurrenceCategory,
  OccurrenceImportance,
  OccurrenceStatus,
} from '../posts/post.service';

export interface DashboardFilters {
  state?: string;
  cityId?: string;
  neighborhoodName?: string;
  from?: string;
  to?: string;
  category?: OccurrenceCategory;
  importance?: OccurrenceImportance;
  status?: OccurrenceStatus;
}

export interface DashboardDistributionItem<T extends string> {
  key: T;
  count: number;
  percentage: number;
}

export interface DashboardCityComparison {
  cityId: string;
  city: string;
  stateCode: string;
  state: string;
  total: number;
  open: number;
  inAnalysis: number;
  resolved: number;
  contested: number;
  reopened: number;
  resolutionRecordedPercentage: number;
  averageResolutionDays: number | null;
  topCategory: OccurrenceCategory | null;
}

export interface CityDashboardResponse {
  period: { from: string; to: string; days: number };
  summary: {
    total: number;
    open: number;
    inAnalysis: number;
    resolved: number;
    contested: number;
    reopened: number;
    resolutionRecorded: number;
    resolutionRecordedPercentage: number;
    unresolved: number;
    unresolvedPercentage: number;
    averageOccurrencesPerDay: number;
  };
  averages: {
    occurrencesPerCity: number;
    occurrencesPerDay: number;
    resolvedPerCity: number;
    openPerCity: number;
    resolutionTimeDays: number | null;
  };
  statusDistribution: DashboardDistributionItem<OccurrenceStatus>[];
  categoryDistribution: DashboardDistributionItem<OccurrenceCategory>[];
  importanceDistribution: DashboardDistributionItem<OccurrenceImportance>[];
  timeline: Array<{ date: string; count: number }>;
  cities: DashboardCityComparison[];
}

export interface DashboardCityOption {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
  occurrenceCount: number;
}

export interface DashboardStateOption {
  code: string;
  name: string;
}

export interface DashboardNeighborhoodOption {
  name: string;
  cityId: string;
  cityName: string;
  stateCode: string;
  occurrenceCount: number;
}

export interface DashboardOptionsResponse {
  states: DashboardStateOption[];
  cities: DashboardCityOption[];
  neighborhoods: DashboardNeighborhoodOption[];
  statuses: OccurrenceStatus[];
  categories: OccurrenceCategory[];
  importanceLevels: OccurrenceImportance[];
}

export interface DashboardOccurrenceListItem {
  id: string;
  title: string;
  description: string;
  status: OccurrenceStatus;
  category: OccurrenceCategory;
  importance: OccurrenceImportance;
  location: { label: string; cityId?: string };
  city: string;
  stateCode: string;
  state: string;
  neighborhoodName?: string;
  createdAt: string;
}

export interface DashboardOccurrenceListResponse {
  data: DashboardOccurrenceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MockCity {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
}

interface MockOccurrence extends DashboardOccurrenceListItem {
  resolutionDays: number | null;
}

const DASHBOARD_STATUSES: OccurrenceStatus[] = [
  'ABERTA',
  'ENCAMINHADA',
  'EM_ANALISE',
  'RESOLUCAO_INFORMADA',
  'RESOLVIDA',
  'CONTESTADA',
  'REABERTA',
  'SEM_ORGAO_IDENTIFICADO',
];

const DASHBOARD_CATEGORIES: OccurrenceCategory[] = [
  'INFRAESTRUTURA',
  'ILUMINACAO_PUBLICA',
  'TRANSITO',
  'LIMPEZA_URBANA',
  'SEGURANCA',
  'MEIO_AMBIENTE',
  'ACESSIBILIDADE',
  'OUTROS',
];

const DASHBOARD_IMPORTANCE_LEVELS: OccurrenceImportance[] = [
  'BAIXA',
  'MEDIA',
  'ALTA',
  'CRITICA',
];

const MOCK_CITIES: MockCity[] = [
  { id: 'sp-sao-paulo', name: 'São Paulo', stateCode: 'SP', stateName: 'São Paulo' },
  { id: 'sp-campinas', name: 'Campinas', stateCode: 'SP', stateName: 'São Paulo' },
  { id: 'rj-rio-de-janeiro', name: 'Rio de Janeiro', stateCode: 'RJ', stateName: 'Rio de Janeiro' },
  { id: 'mg-belo-horizonte', name: 'Belo Horizonte', stateCode: 'MG', stateName: 'Minas Gerais' },
  { id: 'pr-curitiba', name: 'Curitiba', stateCode: 'PR', stateName: 'Paraná' },
];

const MOCK_OCCURRENCE_BLUEPRINTS: Array<
  Omit<MockOccurrence, 'createdAt' | 'location'> & { daysAgo: number }
> = [
  {
    id: 'mock-dashboard-001',
    title: 'Semáforo intermitente na avenida principal',
    description: 'Motoristas relatam risco nos cruzamentos durante os horários de pico.',
    status: 'EM_ANALISE',
    category: 'TRANSITO',
    importance: 'ALTA',
    city: 'São Paulo',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Pinheiros',
    daysAgo: 1,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-002',
    title: 'Buraco aberto perto da escola municipal',
    description: 'A via está parcialmente interditada e moradores sinalizaram o trecho.',
    status: 'ABERTA',
    category: 'INFRAESTRUTURA',
    importance: 'CRITICA',
    city: 'São Paulo',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Mooca',
    daysAgo: 2,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-003',
    title: 'Iluminação apagada na praça central',
    description: 'Postes permanecem apagados há três noites, reduzindo a circulação no local.',
    status: 'ENCAMINHADA',
    category: 'ILUMINACAO_PUBLICA',
    importance: 'MEDIA',
    city: 'Campinas',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Cambuí',
    daysAgo: 4,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-004',
    title: 'Coleta de lixo atrasada em rua residencial',
    description: 'Sacos acumulados ocupam a calçada e dificultam a passagem de pedestres.',
    status: 'RESOLVIDA',
    category: 'LIMPEZA_URBANA',
    importance: 'MEDIA',
    city: 'Curitiba',
    stateCode: 'PR',
    state: 'Paraná',
    neighborhoodName: 'Água Verde',
    daysAgo: 5,
    resolutionDays: 2,
  },
  {
    id: 'mock-dashboard-005',
    title: 'Árvore com risco de queda após temporal',
    description: 'Galhos estão apoiados na fiação e moradores pedem vistoria preventiva.',
    status: 'RESOLUCAO_INFORMADA',
    category: 'MEIO_AMBIENTE',
    importance: 'ALTA',
    city: 'Rio de Janeiro',
    stateCode: 'RJ',
    state: 'Rio de Janeiro',
    neighborhoodName: 'Tijuca',
    daysAgo: 6,
    resolutionDays: 3,
  },
  {
    id: 'mock-dashboard-006',
    title: 'Faixa de pedestres apagada em corredor escolar',
    description: 'A sinalização horizontal está quase invisível em frente à unidade de ensino.',
    status: 'ABERTA',
    category: 'TRANSITO',
    importance: 'ALTA',
    city: 'Belo Horizonte',
    stateCode: 'MG',
    state: 'Minas Gerais',
    neighborhoodName: 'Savassi',
    daysAgo: 8,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-007',
    title: 'Calçada sem acessibilidade no entorno do terminal',
    description: 'Cadeirantes precisam dividir a rua com veículos por falta de rampas.',
    status: 'CONTESTADA',
    category: 'ACESSIBILIDADE',
    importance: 'CRITICA',
    city: 'Campinas',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Centro',
    daysAgo: 9,
    resolutionDays: 6,
  },
  {
    id: 'mock-dashboard-008',
    title: 'Ponto de ônibus sem cobertura danificada',
    description: 'A estrutura metálica está solta e usuários evitam aguardar sob a cobertura.',
    status: 'REABERTA',
    category: 'INFRAESTRUTURA',
    importance: 'MEDIA',
    city: 'Curitiba',
    stateCode: 'PR',
    state: 'Paraná',
    neighborhoodName: 'Centro',
    daysAgo: 11,
    resolutionDays: 5,
  },
  {
    id: 'mock-dashboard-009',
    title: 'Bueiro entupido em trecho alagável',
    description: 'Moradores registraram acúmulo de água após chuva moderada.',
    status: 'EM_ANALISE',
    category: 'INFRAESTRUTURA',
    importance: 'ALTA',
    city: 'Rio de Janeiro',
    stateCode: 'RJ',
    state: 'Rio de Janeiro',
    neighborhoodName: 'Copacabana',
    daysAgo: 13,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-010',
    title: 'Poste inclinado em área comercial',
    description: 'Comerciantes relatam preocupação com fios baixos sobre a calçada.',
    status: 'SEM_ORGAO_IDENTIFICADO',
    category: 'ILUMINACAO_PUBLICA',
    importance: 'ALTA',
    city: 'Belo Horizonte',
    stateCode: 'MG',
    state: 'Minas Gerais',
    neighborhoodName: 'Funcionários',
    daysAgo: 14,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-011',
    title: 'Descarte irregular em área verde',
    description: 'Resíduos foram deixados próximos ao acesso de uma trilha urbana.',
    status: 'RESOLVIDA',
    category: 'MEIO_AMBIENTE',
    importance: 'MEDIA',
    city: 'São Paulo',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Vila Mariana',
    daysAgo: 16,
    resolutionDays: 4,
  },
  {
    id: 'mock-dashboard-012',
    title: 'Travessia insegura próxima ao hospital',
    description: 'Pedestres relatam dificuldade para atravessar uma avenida de alto fluxo.',
    status: 'ENCAMINHADA',
    category: 'TRANSITO',
    importance: 'CRITICA',
    city: 'Rio de Janeiro',
    stateCode: 'RJ',
    state: 'Rio de Janeiro',
    neighborhoodName: 'Botafogo',
    daysAgo: 18,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-013',
    title: 'Mato alto em terreno público',
    description: 'Área precisa de roçada e limpeza para reduzir focos de insetos.',
    status: 'RESOLVIDA',
    category: 'LIMPEZA_URBANA',
    importance: 'BAIXA',
    city: 'Campinas',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Barão Geraldo',
    daysAgo: 22,
    resolutionDays: 7,
  },
  {
    id: 'mock-dashboard-014',
    title: 'Ruído excessivo em praça durante a madrugada',
    description: 'Moradores pedem mediação e fiscalização em horários recorrentes.',
    status: 'ABERTA',
    category: 'SEGURANCA',
    importance: 'MEDIA',
    city: 'Curitiba',
    stateCode: 'PR',
    state: 'Paraná',
    neighborhoodName: 'Batel',
    daysAgo: 24,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-015',
    title: 'Rampa de acesso bloqueada por obra',
    description: 'Tapumes impedem circulação segura de pessoas com mobilidade reduzida.',
    status: 'EM_ANALISE',
    category: 'ACESSIBILIDADE',
    importance: 'ALTA',
    city: 'Belo Horizonte',
    stateCode: 'MG',
    state: 'Minas Gerais',
    neighborhoodName: 'Centro',
    daysAgo: 27,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-016',
    title: 'Placas de orientação turística danificadas',
    description: 'Visitantes relatam dificuldade de localização no centro histórico.',
    status: 'RESOLVIDA',
    category: 'OUTROS',
    importance: 'BAIXA',
    city: 'Rio de Janeiro',
    stateCode: 'RJ',
    state: 'Rio de Janeiro',
    neighborhoodName: 'Centro',
    daysAgo: 32,
    resolutionDays: 8,
  },
  {
    id: 'mock-dashboard-017',
    title: 'Ciclovia com segregador quebrado',
    description: 'Trecho perdeu proteção física e ciclistas desviam para a pista.',
    status: 'CONTESTADA',
    category: 'TRANSITO',
    importance: 'ALTA',
    city: 'São Paulo',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Pinheiros',
    daysAgo: 41,
    resolutionDays: 10,
  },
  {
    id: 'mock-dashboard-018',
    title: 'Vazamento de água em calçada movimentada',
    description: 'O piso permanece escorregadio e a água corre para a sarjeta.',
    status: 'REABERTA',
    category: 'INFRAESTRUTURA',
    importance: 'MEDIA',
    city: 'Campinas',
    stateCode: 'SP',
    state: 'São Paulo',
    neighborhoodName: 'Taquaral',
    daysAgo: 58,
    resolutionDays: 12,
  },
  {
    id: 'mock-dashboard-019',
    title: 'Fiação exposta em poste de iluminação',
    description: 'Moradores isolaram a área e aguardam manutenção da rede.',
    status: 'EM_ANALISE',
    category: 'ILUMINACAO_PUBLICA',
    importance: 'CRITICA',
    city: 'Curitiba',
    stateCode: 'PR',
    state: 'Paraná',
    neighborhoodName: 'Água Verde',
    daysAgo: 73,
    resolutionDays: null,
  },
  {
    id: 'mock-dashboard-020',
    title: 'Praça sem brinquedos acessíveis',
    description: 'Famílias pedem adaptação do espaço para crianças com deficiência.',
    status: 'RESOLVIDA',
    category: 'ACESSIBILIDADE',
    importance: 'MEDIA',
    city: 'Belo Horizonte',
    stateCode: 'MG',
    state: 'Minas Gerais',
    neighborhoodName: 'Savassi',
    daysAgo: 105,
    resolutionDays: 15,
  },
];

@Injectable({ providedIn: 'root' })
export class CityDashboardService {
  private readonly mockOccurrences = this.createMockOccurrences();

  getDashboard(filters: DashboardFilters): Observable<CityDashboardResponse> {
    return of(this.buildDashboard(filters)).pipe(delay(200));
  }

  getOptions(): Observable<DashboardOptionsResponse> {
    return of({
      states: this.buildStates(),
      cities: this.buildCityOptions(),
      neighborhoods: this.buildNeighborhoodOptions(),
      statuses: DASHBOARD_STATUSES,
      categories: DASHBOARD_CATEGORIES,
      importanceLevels: DASHBOARD_IMPORTANCE_LEVELS,
    });
  }

  getOccurrences(
    filters: DashboardFilters,
    page: number,
    limit = 10,
  ): Observable<DashboardOccurrenceListResponse> {
    const filtered = this.filterOccurrences(filters);
    const safeLimit = Math.max(limit, 1);
    const totalPages = Math.max(Math.ceil(filtered.length / safeLimit), 1);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * safeLimit;

    return of({
      data: filtered.slice(start, start + safeLimit).map((item) => this.toListItem(item)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: filtered.length,
        totalPages,
      },
    }).pipe(delay(200));
  }

  private createMockOccurrences(): MockOccurrence[] {
    return MOCK_OCCURRENCE_BLUEPRINTS.map((item) => {
      const createdAt = this.daysAgo(item.daysAgo).toISOString();

      return {
        ...item,
        createdAt,
        location: {
          cityId: this.cityIdFor(item.city, item.stateCode),
          label: [item.neighborhoodName, item.city, item.stateCode].filter(Boolean).join(', '),
        },
      };
    });
  }

  private buildDashboard(filters: DashboardFilters): CityDashboardResponse {
    const filtered = this.filterOccurrences(filters);
    const period = this.periodFrom(filters);
    const cityComparisons = this.buildCityComparisons(filtered);
    const resolutionTimes = filtered
      .map((item) => item.resolutionDays)
      .filter((value): value is number => value !== null);
    const open = this.countStatus(filtered, 'ABERTA');
    const inAnalysis = this.countStatus(filtered, 'EM_ANALISE');
    const resolved = this.countStatus(filtered, 'RESOLVIDA');
    const contested = this.countStatus(filtered, 'CONTESTADA');
    const reopened = this.countStatus(filtered, 'REABERTA');
    const resolutionRecorded = filtered.filter((item) =>
      ['RESOLUCAO_INFORMADA', 'RESOLVIDA', 'CONTESTADA', 'REABERTA'].includes(item.status),
    ).length;
    const total = filtered.length;
    const unresolved = total - resolved;

    return {
      period,
      summary: {
        total,
        open,
        inAnalysis,
        resolved,
        contested,
        reopened,
        resolutionRecorded,
        resolutionRecordedPercentage: this.percentage(resolutionRecorded, total),
        unresolved,
        unresolvedPercentage: this.percentage(unresolved, total),
        averageOccurrencesPerDay: this.round(total / period.days),
      },
      averages: {
        occurrencesPerCity: this.round(total / Math.max(cityComparisons.length, 1)),
        occurrencesPerDay: this.round(total / period.days),
        resolvedPerCity: this.round(resolved / Math.max(cityComparisons.length, 1)),
        openPerCity: this.round(open / Math.max(cityComparisons.length, 1)),
        resolutionTimeDays: this.average(resolutionTimes),
      },
      statusDistribution: this.distribution(filtered, DASHBOARD_STATUSES, (item) => item.status),
      categoryDistribution: this.distribution(filtered, DASHBOARD_CATEGORIES, (item) => item.category),
      importanceDistribution: this.distribution(
        filtered,
        DASHBOARD_IMPORTANCE_LEVELS,
        (item) => item.importance,
      ),
      timeline: this.buildTimeline(filtered, period.from, period.to),
      cities: cityComparisons,
    };
  }

  private filterOccurrences(filters: DashboardFilters): MockOccurrence[] {
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;

    return this.mockOccurrences
      .filter((item) => {
        const createdAt = new Date(item.createdAt);

        if (filters.state && item.stateCode !== filters.state) return false;
        if (filters.cityId && item.location.cityId !== filters.cityId) return false;
        if (filters.neighborhoodName && item.neighborhoodName !== filters.neighborhoodName) {
          return false;
        }
        if (filters.category && item.category !== filters.category) return false;
        if (filters.importance && item.importance !== filters.importance) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (from && createdAt < from) return false;
        if (to && createdAt > to) return false;

        return true;
      })
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  }

  private buildStates(): DashboardStateOption[] {
    const byCode = new Map<string, DashboardStateOption>();

    for (const city of MOCK_CITIES) {
      byCode.set(city.stateCode, { code: city.stateCode, name: city.stateName });
    }

    return [...byCode.values()].sort((first, second) => first.name.localeCompare(second.name));
  }

  private buildCityOptions(): DashboardCityOption[] {
    return MOCK_CITIES.map((city) => ({
      id: city.id,
      name: city.name,
      stateCode: city.stateCode,
      stateName: city.stateName,
      occurrenceCount: this.mockOccurrences.filter((item) => item.location.cityId === city.id).length,
    })).sort((first, second) => first.name.localeCompare(second.name));
  }

  private buildNeighborhoodOptions(): DashboardNeighborhoodOption[] {
    const neighborhoods = new Map<string, DashboardNeighborhoodOption>();

    for (const occurrence of this.mockOccurrences) {
      if (!occurrence.neighborhoodName || !occurrence.location.cityId) continue;

      const key = `${occurrence.location.cityId}:${occurrence.neighborhoodName}`;
      const existing = neighborhoods.get(key);

      if (existing) {
        existing.occurrenceCount += 1;
        continue;
      }

      neighborhoods.set(key, {
        name: occurrence.neighborhoodName,
        cityId: occurrence.location.cityId,
        cityName: occurrence.city,
        stateCode: occurrence.stateCode,
        occurrenceCount: 1,
      });
    }

    return [...neighborhoods.values()].sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }

  private buildCityComparisons(occurrences: MockOccurrence[]): DashboardCityComparison[] {
    return MOCK_CITIES.map((city) => {
      const cityOccurrences = occurrences.filter((item) => item.location.cityId === city.id);
      const total = cityOccurrences.length;
      const resolutionRecorded = cityOccurrences.filter((item) =>
        ['RESOLUCAO_INFORMADA', 'RESOLVIDA', 'CONTESTADA', 'REABERTA'].includes(item.status),
      ).length;
      const resolutionTimes = cityOccurrences
        .map((item) => item.resolutionDays)
        .filter((value): value is number => value !== null);

      return {
        cityId: city.id,
        city: city.name,
        stateCode: city.stateCode,
        state: city.stateName,
        total,
        open: this.countStatus(cityOccurrences, 'ABERTA'),
        inAnalysis: this.countStatus(cityOccurrences, 'EM_ANALISE'),
        resolved: this.countStatus(cityOccurrences, 'RESOLVIDA'),
        contested: this.countStatus(cityOccurrences, 'CONTESTADA'),
        reopened: this.countStatus(cityOccurrences, 'REABERTA'),
        resolutionRecordedPercentage: this.percentage(resolutionRecorded, total),
        averageResolutionDays: this.average(resolutionTimes),
        topCategory: this.topCategory(cityOccurrences),
      };
    })
      .filter((city) => city.total > 0)
      .sort((first, second) => second.total - first.total || first.city.localeCompare(second.city));
  }

  private buildTimeline(
    occurrences: MockOccurrence[],
    from: string,
    to: string,
  ): Array<{ date: string; count: number }> {
    const start = this.startOfDay(new Date(from));
    const end = this.startOfDay(new Date(to));
    const counts = new Map<string, number>();

    for (const occurrence of occurrences) {
      const key = this.dateKey(new Date(occurrence.createdAt));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const timeline: Array<{ date: string; count: number }> = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = this.dateKey(cursor);
      timeline.push({ date: key, count: counts.get(key) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return timeline;
  }

  private distribution<T extends string>(
    occurrences: MockOccurrence[],
    values: T[],
    valueFor: (occurrence: MockOccurrence) => T,
  ): DashboardDistributionItem<T>[] {
    return values
      .map((value) => {
        const count = occurrences.filter((item) => valueFor(item) === value).length;

        return {
          key: value,
          count,
          percentage: this.percentage(count, occurrences.length),
        };
      })
      .filter((item) => item.count > 0);
  }

  private periodFrom(filters: DashboardFilters): { from: string; to: string; days: number } {
    const to = filters.to ? new Date(filters.to) : new Date();
    const from = filters.from
      ? new Date(filters.from)
      : new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    const start = this.startOfDay(from);
    const end = this.startOfDay(to);
    const diff = end.getTime() - start.getTime();
    const days = Math.max(Math.floor(diff / (24 * 60 * 60 * 1000)) + 1, 1);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
    };
  }

  private topCategory(occurrences: MockOccurrence[]): OccurrenceCategory | null {
    let selected: OccurrenceCategory | null = null;
    let selectedCount = 0;

    for (const category of DASHBOARD_CATEGORIES) {
      const count = occurrences.filter((item) => item.category === category).length;

      if (count > selectedCount) {
        selected = category;
        selectedCount = count;
      }
    }

    return selected;
  }

  private countStatus(occurrences: MockOccurrence[], status: OccurrenceStatus): number {
    return occurrences.filter((item) => item.status === status).length;
  }

  private average(values: number[]): number | null {
    if (!values.length) return null;

    return this.round(values.reduce((total, value) => total + value, 0) / values.length);
  }

  private percentage(value: number, total: number): number {
    if (!total) return 0;

    return this.round((value / total) * 100);
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setHours(10, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
  }

  private startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  private dateKey(date: Date): string {
    return this.startOfDay(date).toISOString().slice(0, 10);
  }

  private cityIdFor(cityName: string, stateCode: string): string | undefined {
    return MOCK_CITIES.find((city) => city.name === cityName && city.stateCode === stateCode)?.id;
  }

  private toListItem(occurrence: MockOccurrence): DashboardOccurrenceListItem {
    return {
      id: occurrence.id,
      title: occurrence.title,
      description: occurrence.description,
      status: occurrence.status,
      category: occurrence.category,
      importance: occurrence.importance,
      location: { ...occurrence.location },
      city: occurrence.city,
      stateCode: occurrence.stateCode,
      state: occurrence.state,
      neighborhoodName: occurrence.neighborhoodName,
      createdAt: occurrence.createdAt,
    };
  }
}
