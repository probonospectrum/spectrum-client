import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { authInterceptor } from '../../interceptors/auth.interceptor';
import { PublicAgencyService } from './public-agency.service';
import { UserService, LoggedUser } from './user.service';
import { PostService, SpectrumPost, SpectrumComment } from '../posts/post.service';
describe('Connected institutional account API', () => {
  let api: PublicAgencyService;
  let users: UserService;
  let posts: PostService;
  let http: HttpTestingController;
  const user = {
    _id: '66f1c0de0000000000000001',
    name: 'Ana',
    nickname: 'ana',
    birthDate: '1990-01-01',
    email: 'ana@prefeitura.sp.gov.br',
    occurrenceRole: 'USER',
  } as LoggedUser;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    users = TestBed.inject(UserService);
    api = TestBed.inject(PublicAgencyService);
    posts = TestBed.inject(PostService);
    http = TestBed.inject(HttpTestingController);
    users.saveSession({ user, token: 'session', message: 'Sessão' });
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });
  it('refreshes permissions after approval and removes them after revocation', () => {
    api.status().subscribe();
    const request = http.expectOne(`${API_BASE_URL}/post/agency/account`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer session');
    request.flush({
      accountType: 'PUBLIC_AGENCY',
      isVerified: true,
      occurrenceRole: 'RESPONSIBLE_AGENCY',
      occurrenceAgencyId: 'agency',
      agencyRegistration: { status: 'APPROVED' },
    });
    expect(users.getCurrentUser()).toMatchObject({
      occurrenceRole: 'RESPONSIBLE_AGENCY',
      agencyRegistrationStatus: 'APPROVED',
    });
    api.status().subscribe();
    http
      .expectOne(`${API_BASE_URL}/post/agency/account`)
      .flush({
        accountType: 'PUBLIC_AGENCY',
        occurrenceRole: 'USER',
        occurrenceAgencyId: null,
        agencyRegistration: { status: 'REVOKED' },
      });
    expect(users.getCurrentUser()?.occurrenceRole).toBe('USER');
  });
  it('does not apply an old approval response to another account session', () => {
    api.status().subscribe();
    users.saveSession({
      user: { ...user, _id: 'another' },
      token: 'another-session',
      message: 'Sessão',
    });
    http
      .expectOne(`${API_BASE_URL}/post/agency/account`)
      .flush({ occurrenceRole: 'RESPONSIBLE_AGENCY' });
    expect(users.getCurrentUser()?.occurrenceRole).toBe('USER');
  });
  it('sends official CNPJ review fields through the moderation API', () => {
    const body = {
      decision: 'APPROVED',
      note: 'CNPJ e autorização conferidos em fonte oficial.',
      sourceUrl: 'https://prefeitura.sp.gov.br/atos',
      natureCode: '1031',
      stateCode: 'SP',
      officialName: 'Obras',
      cities: ['São Paulo'],
      categories: ['INFRAESTRUTURA'],
      contactEmail: 'obras@prefeitura.sp.gov.br',
    };
    api.review(user._id, body).subscribe();
    const request = http.expectOne(`${API_BASE_URL}/public-agencies/requests/${user._id}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(body);
    request.flush({ _id: user._id });
  });
  it('uses the backend progress route and waits for persistence before showing closure', () => {
    const post = { id: '66f1c0de0000000000000002' } as SpectrumPost;
    let result: SpectrumPost | undefined;
    const body = {
      status: 'RESOLVIDA' as const,
      note: 'Reparo concluído com evidências do serviço.',
      protocol: 'OBRAS-123',
      evidenceIds: ['photo'],
    };
    posts.recordAgencyProgress(post, user, body).subscribe((value) => (result = value));
    const request = http.expectOne(
      `${API_BASE_URL}/public-agencies/occurrences/${post.id}/progress`,
    );
    expect(request.request.body).toEqual(body);
    expect(result).toBeUndefined();
    request.flush({
      _id: post.id,
      text: 'Ocorrência',
      status: 'RESOLVIDA',
      agencyProgress: { note: body.note, protocol: 'OBRAS-123', closedByAgency: true },
    });
    expect(result).toMatchObject({ status: 'RESOLVIDA', agencyProgress: { closedByAgency: true } });
  });
  it('sends the parent comment ID and displays only the institutional identity returned by the server', () => {
    let result: SpectrumComment | undefined;
    posts
      .createComment('post', 'Vistoria agendada para amanhã.', user, 'parent')
      .subscribe((value) => (result = value));
    const request = http.expectOne(`${API_BASE_URL}/comment`);
    expect(request.request.body).toEqual({
      postId: 'post',
      text: 'Vistoria agendada para amanhã.',
      userId: user._id,
      parentCommentId: 'parent',
    });
    expect(request.request.body.officialAgencyId).toBeUndefined();
    request.flush({
      _id: 'reply',
      userId: user._id,
      parentCommentId: 'parent',
      text: 'Vistoria agendada',
      createdAt: '2026-10-14T12:00:00Z',
      officialAgencyId: 'agency',
      officialAgencyName: 'Obras',
      officialAgencyCnpj: '12ABC34501DE35',
      author: { name: 'Ana' },
    });
    expect(result).toMatchObject({ parentCommentId: 'parent', officialAgencyName: 'Obras' });
  });
});
