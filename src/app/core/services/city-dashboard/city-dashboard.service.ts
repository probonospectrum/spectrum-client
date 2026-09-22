import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';
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

@Injectable({ providedIn: 'root' })
export class CityDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/city-dashboard`;

  getDashboard(filters: DashboardFilters): Observable<CityDashboardResponse> {
    return this.http.get<CityDashboardResponse>(this.apiUrl, {
      params: this.toParams(filters),
    });
  }

  getOptions(): Observable<DashboardOptionsResponse> {
    return this.http.get<DashboardOptionsResponse>(`${this.apiUrl}/options`);
  }

  getOccurrences(
    filters: DashboardFilters,
    page: number,
    limit = 10,
  ): Observable<DashboardOccurrenceListResponse> {
    return this.http.get<DashboardOccurrenceListResponse>(`${this.apiUrl}/occurrences`, {
      params: this.toParams({ ...filters, page, limit }),
    });
  }

  private toParams(values: DashboardFilters & { page?: number; limit?: number }): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return params;
  }
}
