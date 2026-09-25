import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { firstValueFrom } from 'rxjs';
import { PostService } from './post.service';
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
    return service.createPost({ title: 'Buraco na rua', content: 'Buraco em frente à escola municipal.', authorCity: 'São Paulo - SP', mediaType: 'text', tags: [], category: 'INFRAESTRUTURA', importance: 'ALTA', location: { label: 'São Paulo - SP', address: 'Rua da Escola, 10' } }, citizen);
  }

  it('keeps local occurrences pending and never simulates delivery', async () => {
    const post = await firstValueFrom(service.confirmOccurrence(create(), citizen));
    expect(post.status).toBe('AGUARDANDO_ENCAMINHAMENTO');
    expect(() => service.forwardOccurrence(post, moderator, { agency: { id: 'works', name: 'Obras' }, channel: 'EMAIL', sentContent: '' })).toThrow('servidor');
    expect(post.forwardingHistory).toEqual([]);
    expect(post.history.map(event => event.eventType)).toEqual(['OCORRENCIA_CRIADA', 'OCORRENCIA_CONFIRMADA']);
  });

  it('waits for the server before accepting email delivery and preserves pending status on failure', async () => {
    const http = TestBed.inject(HttpTestingController);
    const post = { ...create(), id: '66f1c0de0000000000000001' };
    localStorage.setItem('spectrum-mock-posts', JSON.stringify([post]));
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
    localStorage.setItem('spectrum-mock-posts', JSON.stringify([post]));
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
    localStorage.setItem('spectrum-mock-posts', JSON.stringify([post]));
    const result = firstValueFrom(service.resolveOccurrence(post, moderator, 'Verificação presencial confirmou o reparo.'));
    const rejected = expect(result).rejects.toMatchObject({ status: 403 });
    http.expectOne(`${API_BASE_URL}/post/${post.id}/resolve`).flush({ message: 'Não autorizado' }, { status: 403, statusText: 'Forbidden' });
    await rejected;
    expect(service.findPostById(post.id)?.status).toBe('RESOLUCAO_INFORMADA');
  });

});
