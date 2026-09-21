import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';

const IBGE_LOCALIDADES_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export interface BrazilState {
  id: number;
  sigla: string;
  nome: string;
}

export interface BrazilCity {
  id: number;
  nome: string;
}

export interface NeighborhoodOption {
  name: string;
  occurrenceCount: number;
}

@Injectable({ providedIn: 'root' })
export class LocalityService {
  private readonly http = inject(HttpClient);
  private statesRequest?: Observable<BrazilState[]>;
  private readonly citiesRequests = new Map<string, Observable<BrazilCity[]>>();
  private readonly neighborhoodRequests = new Map<string, Observable<NeighborhoodOption[]>>();

  findStates(): Observable<BrazilState[]> {
    this.statesRequest ??= this.http
      .get<BrazilState[]>(`${IBGE_LOCALIDADES_BASE_URL}/estados?orderBy=nome`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    return this.statesRequest;
  }

  findCitiesByState(stateId: string): Observable<BrazilCity[]> {
    if (!this.citiesRequests.has(stateId)) {
      this.citiesRequests.set(
        stateId,
        this.http
          .get<BrazilCity[]>(
            `${IBGE_LOCALIDADES_BASE_URL}/estados/${stateId}/municipios?orderBy=nome`,
          )
          .pipe(shareReplay({ bufferSize: 1, refCount: false })),
      );
    }

    return this.citiesRequests.get(stateId)!;
  }

  findNeighborhoods(cityId: string, stateCode: string): Observable<NeighborhoodOption[]> {
    const cacheKey = `${stateCode}:${cityId}`;
    if (!this.neighborhoodRequests.has(cacheKey)) {
      this.neighborhoodRequests.set(
        cacheKey,
        this.http
          .get<NeighborhoodOption[]>(`${API_BASE_URL}/localities/neighborhoods`, {
            params: { cityId, stateCode },
          })
          .pipe(shareReplay({ bufferSize: 1, refCount: false })),
      );
    }

    return this.neighborhoodRequests.get(cacheKey)!;
  }

  clearNeighborhoodCache(cityId?: string, stateCode?: string): void {
    if (!cityId || !stateCode) {
      this.neighborhoodRequests.clear();
      return;
    }

    this.neighborhoodRequests.delete(`${stateCode}:${cityId}`);
  }
}
