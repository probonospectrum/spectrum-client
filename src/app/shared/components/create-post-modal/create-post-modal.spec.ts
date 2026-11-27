import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { CreatePostModal } from './create-post-modal';
import {
  NearbyOccurrence,
  OccurrenceAgencyOption,
  PostService,
  SpectrumPost,
} from '../../../core/services/posts/post.service';
import { LocalityService } from '../../../core/services/locality/locality.service';
import { LoggedUser } from '../../../core/services/user/user.service';

describe('Optional regional agency selection', () => {
  let requests: {
    stateCode: string;
    cityName: string;
    response: Subject<OccurrenceAgencyOption[]>;
  }[];
  let create: ReturnType<typeof vi.fn>;
  const findNearbyOccurrences = vi.fn();
  beforeEach(() => {
    requests = [];
    findNearbyOccurrences.mockReset().mockReturnValue(of([]));
    create = vi.fn(() => of({ id: 'saved' } as SpectrumPost));
    TestBed.configureTestingModule({
      imports: [CreatePostModal],
      providers: [
        {
          provide: PostService,
          useValue: {
            createOccurrence: create,
            findNearbyOccurrences,
            getOccurrence: () => of({ status: 'ABERTA', content: 'O pavimento segue danificado.' }),
            getStatusLabel: () => 'Aberta',
            getAgenciesForLocation: (stateCode: string, cityName: string) => {
              const response = new Subject<OccurrenceAgencyOption[]>();
              requests.push({ stateCode, cityName, response });
              return response;
            },
          },
        },
        {
          provide: LocalityService,
          useValue: { findStates: () => of([]), findCitiesByState: () => of([]) },
        },
      ],
    });
  });
  function setup() {
    const fixture = TestBed.createComponent(CreatePostModal);
    const modal = fixture.componentInstance;
    modal.user = { _id: 'citizen', name: 'Pessoa', nickname: 'pessoa' } as LoggedUser;
    modal.states.set([{ id: 35, nome: 'São Paulo', sigla: 'SP' }]);
    modal.cities.set([
      { id: 3518800, nome: 'Guarulhos' },
      { id: 3509502, nome: 'Campinas' },
    ]);
    modal.selectedStateId = '35';
    modal.selectedCityId = '3518800';
    modal.problemTitle = 'Buraco na rua';
    modal.newPostContent = 'Pavimento danificado';
    modal.address = 'Rua Central';
    modal.selectedCategory = 'INFRAESTRUTURA';
    return { fixture, modal };
  }
  it.each(['title', 'description'])('blocks an offensive %s before publishing and allows a corrected submission', field => {
    const { fixture, modal } = setup();
    if (field === 'title') modal.problemTitle = 'Seu idiota'; else modal.newPostContent = 'VOCÊ É UM OTÁRIO';
    modal.publishPost(); fixture.detectChanges();
    expect(create).not.toHaveBeenCalled();
    const warning = fixture.nativeElement.querySelector('.create-post-modal__error');
    expect(warning.textContent).toContain('Revise o texto');
    expect(warning.nextElementSibling.classList.contains('create-post-modal__submit')).toBe(true);
    expect(modal.isPublishing()).toBe(false);
    modal.problemTitle = 'Buraco na rua'; modal.newPostContent = 'Pavimento danificado';
    modal.publishPost(); expect(create).toHaveBeenCalledOnce();
  });

  it('queries the occurrence city, renders the optional selector and submits only the selected identifier', () => {
    const { fixture, modal } = setup();
    modal.onCityChanged();
    expect(requests[0]).toMatchObject({ stateCode: 'SP', cityName: 'Guarulhos' });
    requests[0].response.next([{ id: 'agency', name: 'Secretaria de Obras de Guarulhos' }]);
    requests[0].response.complete();
    modal.selectedAgencyId = 'agency';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.agency-picker').textContent).toContain(
      'Secretaria de Obras de Guarulhos',
    );
    modal.publishPost();
    expect(create.mock.calls[0][0]).toMatchObject({
      agencyId: 'agency',
      location: { cityName: 'Guarulhos', stateCode: 'SP' },
    });
    expect(create.mock.calls[0][0]).not.toHaveProperty('agencyEmail');
  });
  it('clears the selection on a city change and discards the previous city response', () => {
    const { modal } = setup();
    modal.onCityChanged();
    modal.selectedAgencyId = 'old-agency';
    modal.selectedCityId = '3509502';
    modal.onCityChanged();
    requests[0].response.next([{ id: 'old-agency', name: 'Guarulhos' }]);
    expect(modal.availableAgencies()).toEqual([]);
    expect(modal.selectedAgencyId).toBe('');
    requests[1].response.next([{ id: 'new-agency', name: 'Campinas' }]);
    requests[1].response.complete();
    expect(modal.availableAgencies()[0].id).toBe('new-agency');
    modal.removeLocation();
    expect(modal.availableAgencies()).toEqual([]);
    expect(modal.selectedAgencyId).toBe('');
  });
  it('lists only the current address matches and allows publishing anyway', async () => {
    const { fixture, modal } = setup();
    const prior = new Subject<NearbyOccurrence[]>();
    const current = new Subject<NearbyOccurrence[]>();
    findNearbyOccurrences.mockReturnValueOnce(prior).mockReturnValueOnce(current);
    fixture.detectChanges();
    await fixture.whenStable();

    const address = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[maxlength="240"]')!;
    vi.useFakeTimers();
    try {
      address.value = 'Rua 1';
      address.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(350);
      expect(findNearbyOccurrences).toHaveBeenLastCalledWith({
        stateCode: 'SP', cityId: '3518800', category: 'INFRAESTRUTURA', address: 'Rua 1',
      });
      const neighborhood = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[maxlength="100"]')!;
      neighborhood.value = ' Lenize ';
      neighborhood.dispatchEvent(new Event('input'));
      prior.next([{ id: 'prior', title: 'Resultado desatualizado', address: 'Rua 1' }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.nearby-occurrences__notice')).toBeNull();

      vi.advanceTimersByTime(350);
      expect(findNearbyOccurrences).toHaveBeenLastCalledWith(expect.objectContaining({ neighborhood: 'Lenize' }));
      current.next([{ id: 'current', title: 'Buraco na via', address: 'Rua 1' }]);
      fixture.detectChanges();
      const row = fixture.nativeElement.querySelector('.nearby-occurrences li');
      expect(row.querySelector('strong').textContent).toBe('Buraco na via');
      expect(row.querySelector('button span span').textContent).toBe('Rua 1');
      const button = row.querySelector('button');
      button.click();
      fixture.detectChanges();
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(row.querySelector('#nearby-summary-current').textContent).toContain('O pavimento segue danificado.');
      expect(modal.address).toBe('Rua 1');
      button.click();
      fixture.detectChanges();
      expect(row.querySelector('#nearby-summary-current').hidden).toBe(true);
      modal.publishPost();
      expect(create).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('allows publication without an agency even when lookup fails', () => {
    const { fixture, modal } = setup();
    modal.onCityChanged();
    requests[0].response.error(new Error('Offline'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.agency-picker [role="alert"]')).toBeTruthy();
    modal.publishPost();
    expect(create.mock.calls[0][0].agencyId).toBeUndefined();
  });
});
