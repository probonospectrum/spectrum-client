import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { CreatePostModal } from './create-post-modal';
import {
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
  beforeEach(() => {
    requests = [];
    create = vi.fn(() => of({ id: 'saved' } as SpectrumPost));
    TestBed.configureTestingModule({
      imports: [CreatePostModal],
      providers: [
        {
          provide: PostService,
          useValue: {
            createOccurrence: create,
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
