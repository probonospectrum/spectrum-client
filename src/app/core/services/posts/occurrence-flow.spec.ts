import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { firstValueFrom } from 'rxjs';
import { PostService, SpectrumPost } from './post.service';
import { occurrenceStage } from './occurrence-flow';
import { LoggedUser } from '../user/user.service';

const citizen: LoggedUser = { _id: 'citizen', nickname: 'citizen', name: 'Moradora', email: 'test@example.com', birthDate: '1990-01-01', occurrenceRole: 'USER' };
const moderator: LoggedUser = { ...citizen, _id: 'moderator', occurrenceRole: 'MODERATOR' };
const agency: LoggedUser = { ...citizen, _id: 'agency', occurrenceRole: 'RESPONSIBLE_AGENCY', occurrenceAgencyId: 'works' };

describe('Occurrence lifecycle', () => {
  let service: PostService;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PostService);
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); localStorage.clear(); });

  function create() {
    const post: SpectrumPost = { id: '66f1c0de0000000000000001', createdBy: citizen._id, createdAt: new Date().toISOString(), publishedAt: new Date().toISOString(), publishedAtLabel: 'Agora', authorName: citizen.name, authorNickname: citizen.nickname, authorInitial: 'M', title: 'Buraco na rua', content: 'Buraco em frente à escola municipal.', authorCity: 'São Paulo - SP', mediaType: 'text', tags: [], category: 'INFRAESTRUTURA', importance: 'ALTA', location: { label: 'São Paulo - SP', address: 'Rua da Escola, 10' }, status: 'AGUARDANDO_ENCAMINHAMENTO', likes: 0, dislikes: 0, liked: false, disliked: false, comments: 0, reposts: 0, reposted: false, saved: false, evidences: [], history: [], confirmedByIds: [], forwardingHistory: [] };
    localStorage.setItem('spectrum-server-posts:anonymous', JSON.stringify([post]));
    return post;
  }

  it('persists edited routing data and new evidence through the API before updating the cache', async () => {
    const http = TestBed.inject(HttpTestingController);
    const post = { ...create(), id: '66f1c0de0000000000000001' };
    localStorage.setItem('spectrum-server-posts:anonymous', JSON.stringify([post]));
    const payload = { title: 'Novo título', content: 'Descrição atualizada', authorCity: post.authorCity, mediaType: 'text' as const, tags: [], category: 'LIMPEZA_URBANA' as const, location: { label: 'Rua B', cityName: 'São Paulo', stateCode: 'SP' } };
    const result = firstValueFrom(service.updateOccurrence(post, payload, citizen, [{ type: 'IMAGE', url: 'https://example.com/evidence.jpg' }]));
    const request = http.expectOne(`${API_BASE_URL}/post/${post.id}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toMatchObject({ title: payload.title, category: payload.category, location: payload.location, evidences: [{ type: 'IMAGE' }] });
    expect(service.findPostById(post.id)?.title).toBe(post.title);
    request.flush({ ...post, _id: post.id, text: payload.content, description: payload.content, title: payload.title, category: payload.category });
    expect((await result).title).toBe(payload.title);
    expect(service.findPostById(post.id)?.title).toBe(payload.title);
  });

  it('records the response as pending review instead of trusting the supplied resolution code', async () => {
    const http = TestBed.inject(HttpTestingController);
    const post = { ...create(), id: '66f1c0de0000000000000001', status: 'ENCAMINHADA' as const };
    const result = firstValueFrom(service.registerForwardingResponse(post, moderator, 'delivery', 'Serviço concluído', '02', 'PROTO-1'));
    const request = http.expectOne(`${API_BASE_URL}/post/${post.id}/forward/response`);
    expect(request.request.body).toMatchObject({ forwardingId: 'delivery', responseCode: '02', protocol: 'PROTO-1' });
    request.flush({ ...post, _id: post.id, text: post.content, status: 'RESPOSTA_EM_APURACAO' });
    expect((await result).status).toBe('RESPOSTA_EM_APURACAO');
  });

  it('rejects actions on occurrences that were not saved on the server', async () => {
    const post = { ...create(), id: 'local-invalid' };
    await expect(firstValueFrom(service.confirmOccurrence(post, citizen))).rejects.toThrow('servidor');
    await expect(firstValueFrom(service.getOccurrence(post.id, citizen))).rejects.toThrow('não encontrada');
  });

  it('waits for the server before accepting email delivery and preserves pending status on failure', async () => {
    const http = TestBed.inject(HttpTestingController);
    const post = { ...create(), id: '66f1c0de0000000000000001' };
    localStorage.setItem('spectrum-server-posts:anonymous', JSON.stringify([post]));
    const result = firstValueFrom(service.forwardOccurrence(post, moderator, { agency: { id: 'works', name: 'Obras', email: 'works@example.com' }, channel: 'EMAIL', sentContent: '' }));
    const rejected = expect(result).rejects.toMatchObject({ status: 502 });
    const request = http.expectOne(API_BASE_URL + '/post/' + post.id + '/forward');
    expect(request.request.body.channel).toBe('EMAIL');
    expect(service.findPostById(post.id)?.status).toBe('AGUARDANDO_ENCAMINHAMENTO');
    request.flush({ message: 'Falha no envio' }, { status: 502, statusText: 'Bad Gateway' });
    await rejected;
    expect(service.findPostById(post.id)?.forwardingHistory).toEqual([]);
  });

  it('requires moderator review for all response codes', () => {
    const post = { ...create(), status: 'RESPOSTA_EM_APURACAO' as const };
    expect(() => service.reviewForwardingResponse(post, agency, '02', 'Verificado')).toThrow();
    expect(occurrenceStage('REJEITADA')).toBe('Em andamento');
    expect(occurrenceStage('EM_RESOLUCAO')).toBe('Em andamento');
    expect(service.getStatusLabel('FALHA_NO_ENCAMINHAMENTO')).toBe('Falha no encaminhamento');
  });

  it('rejects unsupported forwarding and closing without a proposed solution', () => {
    const post = create();
    expect(() => service.forwardOccurrence(post, moderator, { agency: { name: 'Obras' }, channel: 'EMAIL', sentContent: 'Pedido registrado no portal municipal.', deliveryConfirmed: true })).toThrow();
    expect(() => service.resolveOccurrence(post, moderator, 'Verificação presencial confirmou o reparo.')).toThrow();
    expect(service.findPostById(post.id)?.status).toBe('AGUARDANDO_ENCAMINHAMENTO');
  });
  it('updates the feed only after the server accepts a transition', async () => {
    const http = TestBed.inject(HttpTestingController);
    const post = { ...create(), id: '66f1c0de0000000000000001', status: 'RESOLUCAO_INFORMADA' as const };
    localStorage.setItem('spectrum-server-posts:anonymous', JSON.stringify([post]));
    const result = firstValueFrom(service.resolveOccurrence(post, moderator, 'Verificação presencial confirmou o reparo.'));
    expect(service.findPostById(post.id)?.status).toBe('RESOLUCAO_INFORMADA');
    const request = http.expectOne(`${API_BASE_URL}/post/${post.id}/resolve`);
    expect(request.request.method).toBe('POST');
    request.flush({ ...post, _id: post.id, text: post.content, status: 'RESOLVIDA' });
    await result;
    expect(service.findPostById(post.id)?.status).toBe('RESOLVIDA');
    expect(service.findPostById(post.id)?.authorName).toBe(citizen.name);
  });

  it('does not close the occurrence when the API rejects verification', async () => {
    const http = TestBed.inject(HttpTestingController);
    const post = { ...create(), id: '66f1c0de0000000000000001', status: 'RESOLUCAO_INFORMADA' as const };
    localStorage.setItem('spectrum-server-posts:anonymous', JSON.stringify([post]));
    const result = firstValueFrom(service.resolveOccurrence(post, moderator, 'Verificação presencial confirmou o reparo.'));
    const rejected = expect(result).rejects.toMatchObject({ status: 403 });
    http.expectOne(`${API_BASE_URL}/post/${post.id}/resolve`).flush({ message: 'Não autorizado' }, { status: 403, statusText: 'Forbidden' });
    await rejected;
    expect(service.findPostById(post.id)?.status).toBe('RESOLUCAO_INFORMADA');
  });

});
