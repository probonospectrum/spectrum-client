import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class CityService {
  constructor(private readonly http: HttpClient) {}

  findStates(): Observable<BrazilState[]> {
    return this.http.get<BrazilState[]>(`${IBGE_LOCALIDADES_BASE_URL}/estados?orderBy=nome`);
  }

  findCitiesByState(stateId: string): Observable<BrazilCity[]> {
    return this.http.get<BrazilCity[]>(
      `${IBGE_LOCALIDADES_BASE_URL}/estados/${stateId}/municipios?orderBy=nome`,
    );
  }
}
