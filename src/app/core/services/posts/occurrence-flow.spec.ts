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

  it('persists the complete manual lifecycle, verification and reopening with history', async () => {
    let post = create();
    expect(occurrenceStage(post.status)).toBe('Aberta');
    post = await firstValueFrom(service.confirmOccurrence(post, citizen));
    expect(post.status).toBe('ABERTA');
    post = await firstValueFrom(service.forwardOccurrence(post, moderator, { agency: { id: 'works', name: 'Obras' }, channel: 'WEBSITE', sentContent: 'Pedido registrado no portal municipal.', protocol: '123', deliveryConfirmed: true }));
    expect(occurrenceStage(post.status)).toBe('Em andamento');
    post = await firstValueFrom(service.startOccurrenceAnalysis(post, agency, 'Vistoria técnica iniciada no local.', '123'));
    post = await firstValueFrom(service.informOccurrenceResolution(post, agency, 'Reparo realizado no pavimento.'));
    expect(occurrenceStage(post.status)).toBe('Em andamento');
    expect(() => service.resolveOccurrence(post, citizen, 'Verificação realizada no local.')).toThrow();
    post = await firstValueFrom(service.resolveOccurrence(post, moderator, 'Verificação presencial confirmou o reparo.'));
    expect(occurrenceStage(post.status)).toBe('Fechada');
    post = await firstValueFrom(service.contestOccurrenceResolution(post, citizen, 'O buraco abriu novamente após a chuva.'));
    post = await firstValueFrom(service.reopenOccurrenceFlow(post, citizen, 'Novo reparo é necessário no mesmo local.'));
    expect(occurrenceStage(post.status)).toBe('Aberta');
    const stored = await firstValueFrom(service.getOccurrence(post.id, citizen));
    expect(stored.status).toBe('REABERTA');
    expect(stored.location?.address).toBe('Rua da Escola, 10');
    expect(stored.history.map(event => event.eventType)).toEqual(['OCORRENCIA_CRIADA', 'OCORRENCIA_CONFIRMADA', 'OCORRENCIA_ENCAMINHADA', 'ANALISE_INICIADA', 'RESOLUCAO_INFORMADA', 'OCORRENCIA_RESOLVIDA', 'RESOLUCAO_CONTESTADA', 'OCORRENCIA_REABERTA']);
    expect(stored.history.at(-1)?.actorName).toBe('Moradora');
  });

  it('rejects unsupported forwarding and closing without a proposed solution', () => {
    const post = create();
    expect(() => service.forwardOccurrence(post, moderator, { agency: { name: 'Obras' }, channel: 'EMAIL', sentContent: 'Pedido registrado no portal municipal.', deliveryConfirmed: true })).toThrow();
    expect(() => service.resolveOccurrence(post, moderator, 'Verificação presencial confirmou o reparo.')).toThrow();
    expect(service.findPostById(post.id)?.status).toBe('ABERTA');
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
