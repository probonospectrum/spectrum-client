import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';
import { CityDashboardPage } from './city-dashboard-page';
import { CityDashboardService } from '../../../core/services/city-dashboard/city-dashboard.service';
import { PostService } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';

describe('City dashboard geographic views', () => {
  const params = new BehaviorSubject(convertToParamMap({}));
  const getOccurrences = vi.fn();
  const data = {
    period: { from: '2026-10-01', to: '2026-10-07', days: 7 },
    summary: {
      total: 10,
      open: 5,
      inAnalysis: 0,
      resolved: 5,
      contested: 0,
      reopened: 0,
      resolutionRecordedPercentage: 50,
      unresolvedPercentage: 50,
      averageOccurrencesPerDay: 1.4,
    },
    averages: {
      occurrencesPerCity: 10,
      occurrencesPerDay: 1.4,
      resolvedPerCity: 5,
      openPerCity: 5,
      resolutionTimeDays: null,
    },
    statusDistribution: [],
    categoryDistribution: [],
    cities: [
      {
        cityId: '3550308',
        city: 'São Paulo',
        stateCode: 'SP',
        state: 'SP',
        total: 10,
        open: 5,
        inAnalysis: 0,
        resolved: 5,
        contested: 0,
        reopened: 0,
        resolutionRecordedPercentage: 50,
        averageResolutionDays: null,
        topCategory: null,
      },
    ],
    states: [
      {
        stateCode: 'SP',
        state: 'SP',
        total: 10,
        resolved: 5,
        createdPercentage: 100,
        resolvedPercentage: 100,
        resolutionRate: 50,
      },
    ],
  };

  beforeEach(() => {
    params.next(convertToParamMap({}));
    getOccurrences
      .mockReset()
      .mockReturnValue(of({ data: [], pagination: { total: 0, totalPages: 0 } }));
    TestBed.configureTestingModule({
      imports: [CityDashboardPage],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: params } },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        {
          provide: CityDashboardService,
          useValue: {
            getDashboard: vi.fn().mockReturnValue(of(data)),
            getOccurrences,
            getOptions: vi.fn().mockReturnValue(
              of({
                states: [{ code: 'SP', name: 'São Paulo' }],
                cities: [{ id: '3550308', name: 'São Paulo', stateCode: 'SP' }],
                neighborhoods: [],
                statuses: [],
                categories: [],
                importanceLevels: [],
              }),
            ),
          },
        },
        { provide: UserService, useValue: { getCurrentUser: () => null } },
        {
          provide: PostService,
          useValue: {
            suggestions: [],
            getCategoryLabel: () => 'Outros',
            getStatusLabel: (status: string) => status,
          },
        },
      ],
    }).overrideComponent(CityDashboardPage, {
      set: { imports: [CommonModule, FormsModule], schemas: [NO_ERRORS_SCHEMA] },
    });
  });

  it('shows states only in the national comparison and skips recent-occurrence requests', async () => {
    const fixture = TestBed.createComponent(CityDashboardPage);
    fixture.detectChanges();
    const view: HTMLElement = fixture.nativeElement;
    expect(view.querySelector('.state-comparison')).not.toBeNull();
    expect(view.querySelector('.city-comparison')).toBeNull();
    expect(view.querySelector('.recent-occurrences')).toBeNull();
    expect(getOccurrences).not.toHaveBeenCalled();
    expect(view.textContent).not.toMatch(
      /Série histórica|Comparação objetiva|Prioridade declarada/,
    );
    // Editing a draft filter does not relabel results from the previous request.
    const select = view.querySelector('select') as HTMLSelectElement;
    select.value = 'SP';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(view.querySelector('.state-comparison')).not.toBeNull();
  });

  it('switches from state ranking to city comparison and requests recent occurrences only for a city', () => {
    const fixture = TestBed.createComponent(CityDashboardPage);
    fixture.detectChanges();
    params.next(convertToParamMap({ state: 'SP' }));
    fixture.detectChanges();
    const view: HTMLElement = fixture.nativeElement;
    expect(view.querySelector('.state-comparison')).toBeNull();
    expect(view.querySelector('.city-comparison')).not.toBeNull();
    expect(view.querySelector('.recent-occurrences')).toBeNull();
    expect(getOccurrences).not.toHaveBeenCalled();
    params.next(convertToParamMap({ state: 'SP', cityId: '3550308' }));
    fixture.detectChanges();
    expect(view.querySelector('.recent-occurrences')).not.toBeNull();
    expect(getOccurrences).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'SP', cityId: '3550308' }),
      1,
    );
    params.next(convertToParamMap({}));
    fixture.detectChanges();
    expect(view.querySelector('.recent-occurrences')).toBeNull();
    expect(fixture.componentInstance.occurrences()).toBeNull();
  });
});
