import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ModerationPage } from './moderation-page';
import { PostService, SpectrumPost } from '../../core/services/posts/post.service';
import { UserService } from '../../core/services/user/user.service';

describe('Moderation queue', () => {
  const records = [
    { id: '1', title: 'Luz apagada', status: 'ENCAMINHADA', location: { cityName: 'São Paulo' } },
    { id: '2', title: 'Praça', status: 'RESPOSTA_EM_APURACAO', moderationReason: 'RESPOSTA_EM_APURACAO' },
    { id: '3', title: 'Rua', status: 'RESOLVIDA' },
  ] as SpectrumPost[];
  let api: { getModerationOccurrences: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    api = { getModerationOccurrences: vi.fn().mockReturnValue(of(records)) };
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      { provide: PostService, useValue: api },
      { provide: UserService, useValue: { getCurrentUser: () => ({ occurrenceRole: 'MODERATOR' }) } },
    ] });
  });
  const page = () => TestBed.runInInjectionContext(() => new ModerationPage());
  it('filters responses without including resolved or merely forwarded records', () => {
    const component = page(); component.filter = 'review';
    expect(component.visible.map(p => p.id)).toEqual(['2']);
    expect(component.pendingCount).toBe(1);
    expect(component.action(records[1])).toBe('Analisar resposta');
  });
  it('combines city search with the selected status', () => {
    const component = page(); component.search = 'são paulo'; component.filter = 'sent';
    expect(component.visible.map(p => p.id)).toEqual(['1']);
    component.filter = 'resolved'; expect(component.visible).toEqual([]);
  });
  it('shows an error and supports retry after a failed request', () => {
    api.getModerationOccurrences.mockReturnValueOnce(throwError(() => new Error('offline')));
    const component = page(); expect(component.error).toBeTruthy(); expect(component.loading()).toBe(false);
    component.load(); expect(component.error).toBe(''); expect(component.items()).toHaveLength(3);
  });
});
