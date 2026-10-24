import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ModerationPage } from './moderation-page';
import { PostService, SpectrumPost } from '../../core/services/posts/post.service';
import { UserService } from '../../core/services/user/user.service';

describe('Moderation queues', () => {
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let api: { getModerationOccurrences: ReturnType<typeof vi.fn>; getModerationReports: ReturnType<typeof vi.fn>; removeReportedPost: ReturnType<typeof vi.fn> };
  const records = [{ id: '1', title: 'Luz apagada', content: 'Rua A', location: { cityName: 'São Paulo' } }] as SpectrumPost[];
  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ queue: 'sem-orgao' }));
    api = { getModerationOccurrences: vi.fn().mockReturnValue(of(records)), getModerationReports: vi.fn().mockReturnValue(of([])), removeReportedPost: vi.fn().mockReturnValue(of({ message: 'Removida' })) };
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: params, snapshot: { get paramMap() { return params.value; } } } },
      { provide: PostService, useValue: api },
      { provide: UserService, useValue: { getCurrentUser: () => ({ occurrenceRole: 'MODERATOR' }) } },
    ] });
  });
  const page = () => TestBed.runInInjectionContext(() => new ModerationPage());
  it('loads the selected queue again when navigating between sidebar links', () => {
    const component = page();
    expect(api.getModerationOccurrences).toHaveBeenLastCalledWith(expect.anything(), 'sem-orgao');
    params.next(convertToParamMap({ queue: 'resolvidas' }));
    expect(component.title).toBe('Resolvidas');
    expect(api.getModerationOccurrences).toHaveBeenLastCalledWith(expect.anything(), 'resolvidas');
    params.next(convertToParamMap({ queue: 'denunciados' }));
    expect(api.getModerationReports).toHaveBeenCalledOnce();
    expect(component.items()).toEqual([]);
  });
  it('searches the loaded queue by city', () => {
    const component = page(); component.search = 'são paulo'; expect(component.visible).toHaveLength(1);
    component.search = 'outra'; expect(component.visible).toEqual([]);
  });
  it('requires a clean review reason before removing a reported publication', () => {
    const component = page();
    component.beginRemoval({ id: 'reported', postId: 'reported', kind: 'post', title: 'Título', count: 2, reasons: ['Assédio'] });
    component.confirmRemoval(); expect(api.removeReportedPost).not.toHaveBeenCalled();
    component.removalReason = 'Seu idiota'; component.confirmRemoval();
    expect(api.removeReportedPost).not.toHaveBeenCalled();
    expect(component.removalError).toContain('Revise o texto');
    component.removalReason = 'Denúncia procedente após análise.'; component.confirmRemoval();
    expect(api.removeReportedPost).toHaveBeenCalledWith('reported', 'Denúncia procedente após análise.');
    expect(component.removalTarget).toBeNull();
  });

  it('shows an error and supports retry', () => {
    api.getModerationOccurrences.mockReturnValueOnce(throwError(() => new Error('offline')));
    const component = page(); expect(component.error).toBeTruthy(); expect(component.loading()).toBe(false);
    component.load(); expect(component.error).toBe(''); expect(component.items()).toHaveLength(1);
  });
});
