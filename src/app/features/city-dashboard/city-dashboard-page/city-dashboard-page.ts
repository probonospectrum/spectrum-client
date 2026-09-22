import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  CityDashboardResponse,
  CityDashboardService,
  DashboardCityOption,
  DashboardFilters,
  DashboardNeighborhoodOption,
  DashboardOccurrenceListResponse,
  DashboardOptionsResponse,
} from '../../../core/services/city-dashboard/city-dashboard.service';
import {
  OccurrenceCategory,
  OccurrenceImportance,
  OccurrenceStatus,
  PostService,
} from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { LoadingIndicator } from '../../../shared/components/loading-indicator/loading-indicator';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';
import {
  DashboardBarChart,
  DashboardBarItem,
} from '../dashboard-bar-chart/dashboard-bar-chart';
import { DashboardLineChart } from '../dashboard-line-chart/dashboard-line-chart';

interface PeriodOption {
  value: string;
  label: string;
  days?: number;
}

@Component({
  selector: 'app-city-dashboard-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SocialShell,
    LoadingIndicator,
    DashboardBarChart,
    DashboardLineChart,
  ],
  templateUrl: './city-dashboard-page.html',
  styleUrl: './city-dashboard-page.scss',
})
export class CityDashboardPage implements OnInit {
  private readonly dashboardService = inject(CityDashboardService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  readonly periodOptions: PeriodOption[] = [
    { value: '7', label: 'Últimos 7 dias', days: 7 },
    { value: '30', label: 'Últimos 30 dias', days: 30 },
    { value: '90', label: 'Últimos 90 dias', days: 90 },
    { value: '365', label: 'Últimos 12 meses', days: 365 },
    { value: 'custom', label: 'Dia selecionado' },
  ];

  options = signal<DashboardOptionsResponse | null>(null);
  dashboard = signal<CityDashboardResponse | null>(null);
  occurrences = signal<DashboardOccurrenceListResponse | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  selectedState = '';
  selectedCityId = '';
  selectedNeighborhoodName = '';
  selectedPeriod = '30';
  selectedCategory: OccurrenceCategory | '' = '';
  selectedImportance: OccurrenceImportance | '' = '';
  selectedStatus: OccurrenceStatus | '' = '';
  private customFrom = '';
  private customTo = '';
  currentPage = 1;

  ngOnInit(): void {
    this.dashboardService
      .getOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => this.options.set(options),
        error: (error: unknown) => this.errorMessage.set(this.errorFor(error)),
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.selectedState = params.get('state') ?? '';
        this.selectedCityId = params.get('cityId') ?? '';
        this.selectedNeighborhoodName = params.get('neighborhoodName') ?? '';
        this.selectedCategory = (params.get('category') as OccurrenceCategory | null) ?? '';
        this.selectedImportance =
          (params.get('importance') as OccurrenceImportance | null) ?? '';
        this.selectedStatus = (params.get('status') as OccurrenceStatus | null) ?? '';
        this.customFrom = params.get('from') ?? '';
        this.customTo = params.get('to') ?? '';
        this.selectedPeriod = this.customFrom ? 'custom' : (params.get('period') ?? '30');
        this.currentPage = Math.max(Number(params.get('page') ?? 1), 1);
        this.loadDashboard();
      });
  }

  get availableCities(): DashboardCityOption[] {
    const cities = this.options()?.cities ?? [];
    return this.selectedState
      ? cities.filter((city) => city.stateCode === this.selectedState)
      : cities;
  }

  get availableNeighborhoods(): DashboardNeighborhoodOption[] {
    const neighborhoods = this.options()?.neighborhoods ?? [];
    return neighborhoods.filter((neighborhood) => {
      if (this.selectedState && neighborhood.stateCode !== this.selectedState) return false;
      if (this.selectedCityId && neighborhood.cityId !== this.selectedCityId) return false;
      return true;
    });
  }

  get selectedCityLabel(): string {
    const city = this.options()?.cities.find((item) => item.id === this.selectedCityId);
    return city ? `${city.name} - ${city.stateCode}` : 'Todas as cidades';
  }

  get statusChartItems(): DashboardBarItem[] {
    return (this.dashboard()?.statusDistribution ?? []).map((item) => ({
      key: item.key,
      label: this.statusLabel(item.key),
      value: item.count,
      detail: `${this.number(item.percentage)}% do total`,
      color: this.statusColor(item.key),
    }));
  }

  get categoryChartItems(): DashboardBarItem[] {
    return (this.dashboard()?.categoryDistribution ?? []).map((item) => ({
      key: item.key,
      label: this.categoryLabel(item.key),
      value: item.count,
      detail: `${this.number(item.percentage)}% do total`,
    }));
  }

  get importanceChartItems(): DashboardBarItem[] {
    return (this.dashboard()?.importanceDistribution ?? []).map((item) => ({
      key: item.key,
      label: this.importanceLabel(item.key),
      value: item.count,
      detail: `${this.number(item.percentage)}% do total`,
      color: this.importanceColor(item.key),
    }));
  }

  get cityChartItems(): DashboardBarItem[] {
    return (this.dashboard()?.cities ?? []).slice(0, 10).map((city) => ({
      key: city.cityId,
      label: `${city.city} - ${city.state}`,
      value: city.total,
      detail: `${city.resolved} resolvidas · ${city.open} abertas`,
    }));
  }

  onStateChanged(): void {
    if (!this.availableCities.some((city) => city.id === this.selectedCityId)) {
      this.selectedCityId = '';
    }
    this.selectedNeighborhoodName = '';
  }

  onCityChanged(): void {
    if (!this.availableNeighborhoods.some((item) => item.name === this.selectedNeighborhoodName)) {
      this.selectedNeighborhoodName = '';
    }
  }

  applyFilters(): void {
    void this.navigateWithFilters(1);
  }

  clearFilters(): void {
    this.selectedState = '';
    this.selectedCityId = '';
    this.selectedNeighborhoodName = '';
    this.selectedPeriod = '30';
    this.selectedCategory = '';
    this.selectedImportance = '';
    this.selectedStatus = '';
    this.customFrom = '';
    this.customTo = '';
    void this.navigateWithFilters(1);
  }

  selectStatus(status: string): void {
    this.selectedStatus = status as OccurrenceStatus;
    void this.navigateWithFilters(1, true);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category as OccurrenceCategory;
    void this.navigateWithFilters(1, true);
  }

  selectImportance(importance: string): void {
    this.selectedImportance = importance as OccurrenceImportance;
    void this.navigateWithFilters(1, true);
  }

  selectCity(cityId: string): void {
    const city = this.options()?.cities.find((item) => item.id === cityId);
    this.selectedCityId = cityId;
    this.selectedState = city?.stateCode ?? this.selectedState;
    this.selectedNeighborhoodName = '';
    void this.navigateWithFilters(1, true);
  }

  selectDate(date: string): void {
    this.selectedPeriod = 'custom';
    this.customFrom = `${date}T00:00:00.000Z`;
    this.customTo = `${date}T23:59:59.999Z`;
    void this.navigateWithFilters(1, true);
  }

  goToPage(page: number): void {
    const totalPages = this.occurrences()?.pagination.totalPages ?? 0;
    if (page < 1 || page > totalPages || page === this.currentPage) return;
    void this.navigateWithFilters(page, true);
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  statusLabel(status: OccurrenceStatus): string {
    return this.postService.getStatusLabel(status);
  }

  categoryLabel(category: OccurrenceCategory | null): string {
    return this.postService.getCategoryLabel(category ?? undefined);
  }

  importanceLabel(importance: OccurrenceImportance): string {
    return this.postService.getImportanceLabel(importance);
  }

  number(value: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const filters = this.currentFilters();

    forkJoin({
      dashboard: this.dashboardService.getDashboard(filters),
      occurrences: this.dashboardService.getOccurrences(filters, this.currentPage),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ dashboard, occurrences }) => {
          this.dashboard.set(dashboard);
          this.occurrences.set(occurrences);
        },
        error: (error: unknown) => this.errorMessage.set(this.errorFor(error)),
      });
  }

  private currentFilters(): DashboardFilters {
    const period = this.periodRange();
    return {
      state: this.selectedState || undefined,
      cityId: this.selectedCityId || undefined,
      neighborhoodName: this.selectedNeighborhoodName || undefined,
      category: this.selectedCategory || undefined,
      importance: this.selectedImportance || undefined,
      status: this.selectedStatus || undefined,
      from: period.from,
      to: period.to,
    };
  }

  private periodRange(): { from: string; to: string } {
    if (this.selectedPeriod === 'custom' && this.customFrom && this.customTo) {
      return { from: this.customFrom, to: this.customTo };
    }

    const days = Number(this.selectedPeriod) || 30;
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  private async navigateWithFilters(page: number, scrollToList = false): Promise<void> {
    const queryParams: Record<string, string | number | null> = {
      state: this.selectedState || null,
      cityId: this.selectedCityId || null,
      neighborhoodName: this.selectedNeighborhoodName || null,
      period: this.selectedPeriod === 'custom' ? null : this.selectedPeriod,
      from: this.selectedPeriod === 'custom' ? this.customFrom : null,
      to: this.selectedPeriod === 'custom' ? this.customTo : null,
      category: this.selectedCategory || null,
      importance: this.selectedImportance || null,
      status: this.selectedStatus || null,
      page: page > 1 ? page : null,
    };

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: false,
    });

    if (scrollToList) {
      setTimeout(() => document.getElementById('ocorrencias-recentes')?.scrollIntoView(), 0);
    }
  }

  private statusColor(status: OccurrenceStatus): string {
    const colors: Record<OccurrenceStatus, string> = {
      ABERTA: '#c9772b',
      ENCAMINHADA: '#347da8',
      EM_ANALISE: '#6759a7',
      RESOLUCAO_INFORMADA: '#27877f',
      RESOLVIDA: '#287a55',
      CONTESTADA: '#b64d45',
      REABERTA: '#a35f28',
      SEM_ORGAO_IDENTIFICADO: '#697782',
    };
    return colors[status];
  }

  private importanceColor(importance: OccurrenceImportance): string {
    return {
      BAIXA: '#668a72',
      MEDIA: '#347da8',
      ALTA: '#c9772b',
      CRITICA: '#b64d45',
    }[importance];
  }

  private errorFor(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Não foi possível carregar os indicadores. Tente novamente em instantes.';
  }
}
