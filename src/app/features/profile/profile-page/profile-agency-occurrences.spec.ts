import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PublicAgencyService } from '../../../core/services/user/public-agency.service';
import { ProfileAgencyOccurrences } from './profile-agency-occurrences';

describe('ProfileAgencyOccurrences', () => {
  it('paginates within the selected status and resets the list when the status changes', () => {
    const dates = { createdAt: '2026-10-01', updatedAt: '2026-10-01' };
    const open = { ...dates, _id: 'open', title: 'Buraco na rua', status: 'ABERTA' };
    const next = { ...open, _id: 'next', title: 'Calçada danificada' };
    const firstPage = [open, { ...open, _id: 'second' }, { ...open, _id: 'third' }];
    const resolved = { ...dates, _id: 'resolved', title: 'Lâmpada substituída', status: 'RESOLVIDA' };
    const inbox = vi.fn()
      .mockReturnValueOnce(of({ data: firstPage, total: 4, nextCursor: 'cursor', summary: { total: 5, resolved: 2, last30Days: 2, resolvedLast30Days: 1 } }))
      .mockReturnValueOnce(of({ data: [next], total: 4, nextCursor: null }))
      .mockReturnValueOnce(of({ data: [resolved], total: 1, nextCursor: null }));
    TestBed.configureTestingModule({
      imports: [ProfileAgencyOccurrences],
      providers: [provideRouter([]), { provide: PublicAgencyService, useValue: { inbox } }],
    });
    const fixture = TestBed.createComponent(ProfileAgencyOccurrences);
    fixture.detectChanges();

    const view: HTMLElement = fixture.nativeElement;
    expect(inbox).toHaveBeenLastCalledWith(undefined, {
      status: 'open', search: '', order: 'newest', limit: 3, summary: 1,
    });
    expect(view.querySelectorAll('li')).toHaveLength(3);
    expect([...view.querySelectorAll('td')].map(field => field.textContent?.trim())).toEqual(['5', '2', '2', '1']);
    expect(view.querySelector('progress')?.value).toBe(40);
    expect(view.querySelector('a')?.getAttribute('href')).toBe('/ocorrencias/open?origem=orgao');

    view.querySelector<HTMLButtonElement>('.assignments > button')?.click();
    fixture.detectChanges();
    expect(inbox).toHaveBeenLastCalledWith('cursor', {
      status: 'open', search: '', order: 'newest', limit: 3,
    });
    expect(view.querySelectorAll('li')).toHaveLength(4);

    view.querySelectorAll('button')[1].click();
    fixture.detectChanges();
    expect(inbox).toHaveBeenLastCalledWith(undefined, {
      status: 'resolved', search: '', order: 'newest', limit: 3, summary: 1,
    });
    expect(view.querySelectorAll('li')).toHaveLength(1);
    expect(view.querySelector('a')?.getAttribute('href')).toBe('/ocorrencias/resolved?origem=orgao');
  });

  it('loads the visited institution through the profile endpoint', () => {
    const profileOccurrences = vi.fn().mockReturnValue(of({
      data: [{ _id: 'open', title: 'Buraco na rua', status: 'ABERTA' }],
      total: 1,
      nextCursor: null,
    }));
    const inbox = vi.fn();
    TestBed.configureTestingModule({
      imports: [ProfileAgencyOccurrences],
      providers: [
        provideRouter([]),
        { provide: PublicAgencyService, useValue: { inbox, profileOccurrences } },
      ],
    });
    const fixture = TestBed.createComponent(ProfileAgencyOccurrences);
    fixture.componentRef.setInput('profileId', 'institution');
    fixture.componentRef.setInput('profileNickname', 'secretaria_obras');
    fixture.detectChanges();

    expect(profileOccurrences).toHaveBeenLastCalledWith('institution', undefined, {
      status: 'open', search: '', order: 'newest', limit: 3, summary: 1,
    });
    expect(inbox).not.toHaveBeenCalled();
    const view: HTMLElement = fixture.nativeElement;
    expect(view.querySelector('a')?.getAttribute('href'))
      .toBe('/ocorrencias/open?origem=orgao&perfilOrgao=secretaria_obras');
  });
});
