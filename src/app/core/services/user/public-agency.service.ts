import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, tap } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';
import { UserService } from './user.service';
export interface AgencyInboxItem {
  _id: string;
  title: string;
  status: string;
  location?: { cityName?: string; stateCode?: string; label?: string };
  createdAt: string;
  updatedAt: string;
}
export interface AgencyInboxPage { data: AgencyInboxItem[]; total: number; nextCursor: string | null; }
export interface AgencyRequest {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  agencyRegistration: AgencyRegistration;
}
export interface AgencyRegistration {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  cnpj: string;
  name: string;
  position: string;
  authorizationReference: string;
  reviews?: { note: string; date: string }[];
}
export interface AgencyStatus {
  accountType: 'CITIZEN' | 'PUBLIC_AGENCY';
  isVerified: boolean;
  occurrenceRole: 'USER' | 'RESPONSIBLE_AGENCY' | 'MODERATOR';
  occurrenceAgencyId?: string;
  agencyRegistration: AgencyRegistration | null;
}
@Injectable({ providedIn: 'root' })
export class PublicAgencyService {
  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);
  private readonly url = `${API_BASE_URL}/public-agencies`;
  status() {
    const user = this.users.getCurrentUser();
    return this.http.get<AgencyStatus>(`${API_BASE_URL}/post/agency/account`).pipe(
      tap((status) => {
        if (user && this.users.getCurrentUser()?._id === user._id)
          this.users.updateSessionUser({
            ...user,
            accountType: status.accountType,
            isVerified: status.isVerified,
            occurrenceRole: status.occurrenceRole,
            occurrenceAgencyId: status.occurrenceAgencyId,
            agencyRegistrationStatus: status.agencyRegistration?.status,
          });
      }),
    );
  }
  resend() {
    return this.http.post<{ message: string }>(`${this.url}/me/resend-verification`, {});
  }
  inbox(cursor?: string, filters: { search?: string; status?: string; order?: string } = {}) {
    return this.http.get<AgencyInboxPage>(`${API_BASE_URL}/post/agency/inbox`, {
      params: { ...filters, ...(cursor ? { cursor } : {}) },
    });
  }
  assigned() { return this.inbox().pipe(map(page => page.data)); }
  requests() {
    return this.http.get<AgencyRequest[]>(`${this.url}/requests`);
  }
  review(
    id: string,
    body: {
      decision: string;
      note: string;
      sourceUrl: string;
      agencyId?: string;
      officialName?: string;
      natureCode?: string;
      stateCode?: string;
      cities?: string[];
      categories?: string[];
      contactEmail?: string;
    },
  ) {
    return this.http.patch<AgencyRequest>(`${this.url}/requests/${id}`, body);
  }
}
