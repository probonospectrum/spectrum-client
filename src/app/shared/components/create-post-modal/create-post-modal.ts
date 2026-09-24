import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import {
  BrazilCity,
  BrazilState,
  LocalityService,
} from '../../../core/services/locality/locality.service';
import { MockLoadingService } from '../../../core/services/loading/mock-loading.service';
import {
  CreateOccurrenceEvidencePayload,
  OccurrenceCategory,
  OccurrenceImportance,
  PostService,
  SpectrumPost,
} from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';
import { LoadingIndicator } from '../loading-indicator/loading-indicator';

import { IMPORTANCE_GUIDANCE } from '../../../core/services/posts/occurrence-flow';

interface SelectedEvidence {
  file: File;
  type: 'IMAGE' | 'VIDEO';
}

@Component({
  selector: 'app-create-post-modal',
  imports: [CommonModule, FormsModule, LoadingIndicator],
  templateUrl: './create-post-modal.html',
  styleUrl: './create-post-modal.scss',
})
export class CreatePostModal implements OnChanges {
  private readonly postService = inject(PostService);
  private readonly localityService = inject(LocalityService);
  private readonly mockLoadingService = inject(MockLoadingService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() user: LoggedUser | null = null;
  @Input() editingPost: SpectrumPost | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<SpectrumPost>();
  @Output() postUpdated = new EventEmitter<SpectrumPost>();

  readonly categories: Array<{ value: OccurrenceCategory; label: string }> = [
    { value: 'INFRAESTRUTURA', label: 'Infraestrutura' },
    { value: 'ILUMINACAO_PUBLICA', label: 'Iluminação pública' },
    { value: 'TRANSITO', label: 'Trânsito' },
    { value: 'LIMPEZA_URBANA', label: 'Limpeza urbana' },
    { value: 'SEGURANCA', label: 'Segurança' },
    { value: 'MEIO_AMBIENTE', label: 'Meio ambiente' },
    { value: 'ACESSIBILIDADE', label: 'Acessibilidade' },
    { value: 'OUTROS', label: 'Outros' },
  ];
  readonly importanceOptions: Array<{ value: OccurrenceImportance; label: string }> = [
    { value: 'BAIXA', label: 'Baixa' },
    { value: 'MEDIA', label: 'Média' },
    { value: 'ALTA', label: 'Alta' },
  ];

  readonly importanceGuidance = IMPORTANCE_GUIDANCE;
  address = '';
  neighborhood = '';
  problemTitle = '';
  newPostContent = '';
  selectedCategory: OccurrenceCategory | '' = '';
  selectedImportance: OccurrenceImportance = 'MEDIA';
  selectedStateId = '';
  selectedCityId = '';
  states = signal<BrazilState[]>([]);
  cities = signal<BrazilCity[]>([]);
  isLoadingStates = signal(false);
  isLoadingCities = signal(false);
  locationErrorMessage = '';
  selectedEvidences: SelectedEvidence[] = [];
  errorMessage = '';
  isPublishing = signal(false);

  get displayName(): string {
    return this.user?.name || 'Usuario Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  get locationLabel(): string {
    const state = this.selectedState;
    const city = this.selectedCity;
    return state && city
      ? `${city.nome} - ${state.sigla}`
      : 'Selecione a localização';
  }

  get isEditing(): boolean {
    return Boolean(this.editingPost);
  }

  get modalTitle(): string {
    return this.isEditing ? 'Editar ocorrência' : 'Criar ocorrência';
  }

  get submitLabel(): string {
    return this.isEditing ? 'Salvar alterações' : 'Publicar ocorrência';
  }

  get canSubmit(): boolean {
    return Boolean(
      this.newPostContent.trim() &&
        this.problemTitle.trim() &&
        this.address.trim() &&
        this.selectedCategory &&
        this.selectedImportance &&
        this.selectedState &&
        this.selectedCity &&
        this.user?._id &&
        !this.isPublishing(),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingPost']) {
      this.applyEditingPost();
    }

    if (changes['user']) {
      this.loadStates();
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.close.emit();
  }

  removeLocation(): void {
    this.selectedStateId = '';
    this.selectedCityId = '';
    this.cities.set([]);
    this.locationErrorMessage = '';
  }

  onStateChanged(): void {
    this.selectedCityId = '';
    this.cities.set([]);
    this.locationErrorMessage = '';

    if (this.selectedStateId) {
      this.loadCities(this.selectedStateId);
    }
  }

  onCityChanged(): void {
    this.locationErrorMessage = '';
  }

  retryLocationLoad(): void {
    if (!this.states().length) {
      this.loadStates();
      return;
    }
    if (this.selectedStateId) {
      this.loadCities(this.selectedStateId);
    }
  }

  selectAttachments(event: Event, type: SelectedEvidence['type']): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    for (const file of files) {
      if (this.selectedEvidences.length >= 4) {
        this.errorMessage = 'Você pode adicionar até quatro evidências.';
        break;
      }
      if (file.size > 25 * 1024 * 1024) {
        this.errorMessage = `${file.name} excede o limite de 25 MB.`;
        continue;
      }
      this.selectedEvidences.push({ file, type });
      this.errorMessage = '';
    }
  }

  removeAttachment(index: number): void {
    this.selectedEvidences.splice(index, 1);
  }

  publishPost(): void {
    const validationMessage = this.validateForm();
    if (validationMessage) {
      this.errorMessage = validationMessage;
      return;
    }

    if (this.editingPost) {
      this.updateExistingOccurrence();
      return;
    }

    const user = this.user!;
    const state = this.selectedState!;
    const city = this.selectedCity!;
    const title = this.problemTitle.trim();
    const content = this.newPostContent.trim();

    this.errorMessage = '';
    this.isPublishing.set(true);
    this.uploadEvidenceFiles()
      .pipe(
        switchMap((evidences) =>
          this.postService.createOccurrence(
            {
              text: content,
              title,
              description: content,
              category: this.selectedCategory as OccurrenceCategory,
              importance: this.selectedImportance,
              location: {
                label: `${city.nome} - ${state.sigla}`,
                city: city.nome,
                state: state.sigla,
                stateCode: state.sigla,
                stateName: state.nome,
                cityId: String(city.id),
                cityName: city.nome,
                address: this.address.trim(),
                neighborhoodName: this.neighborhood.trim() || undefined,
              },
              evidences,
              createdBy: user._id,
              cityId: String(city.id),
            },
            user,
          ),
        ),
        finalize(() => this.isPublishing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (post) => {
          this.postCreated.emit(post);
          this.closeModal();
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(error);
        },
      });
  }

  private validateForm(): string {
    if (!this.problemTitle.trim()) return 'Informe um título curto para o problema.';
    if (!this.newPostContent.trim()) return 'Explique o problema com mais detalhes.';
    if (!this.selectedCategory) return 'Selecione a categoria da ocorrência.';
    if (!this.selectedImportance) return 'Selecione o nível de importância.';
    if (!this.address.trim()) return 'Informe o endereço ou um ponto de referência para localizar o problema.';
    if (!this.selectedState) return 'Selecione o estado da ocorrência.';
    if (!this.selectedCity) return 'Selecione a cidade da ocorrência.';
    if (!this.user?._id) return 'Entre novamente na sua conta para publicar a ocorrência.';
    return '';
  }

  private uploadEvidenceFiles() {
    if (!this.selectedEvidences.length) {
      return of([] as CreateOccurrenceEvidencePayload[]);
    }

    return forkJoin(
      this.selectedEvidences.map(({ file, type }) =>
        this.postService.uploadEvidence(file).pipe(
          map((upload) => ({ type, url: upload.url, description: file.name })),
        ),
      ),
    );
  }

  private updateExistingOccurrence(): void {
    const content = this.newPostContent.trim();
    const title = this.problemTitle.trim();
    const payload = {
      title,
      content,
      authorCity: this.locationLabel,
      mediaType: this.editingPost?.mediaType ?? ('text' as const),
      tags: this.editingPost?.tags ?? [],
      category: this.selectedCategory as OccurrenceCategory,
      importance: this.selectedImportance,
      location: {
        ...this.editingPost?.location,
        label: this.locationLabel,
        city: this.selectedCity!.nome,
        cityName: this.selectedCity!.nome,
        cityId: String(this.selectedCity!.id),
        state: this.selectedState!.sigla,
        stateCode: this.selectedState!.sigla,
        stateName: this.selectedState!.nome,
        address: this.address.trim(),
        neighborhoodName: this.neighborhood.trim() || undefined,
      },
    };

    this.isPublishing.set(true);
    this.mockLoadingService
      .load(() => this.postService.updatePost(this.editingPost!.id, payload, this.user))
      .pipe(
        finalize(() => this.isPublishing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (post) => {
          this.postUpdated.emit(post);
          this.closeModal();
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(error);
        },
      });
  }

  private applyEditingPost(): void {
    this.problemTitle = this.editingPost?.title ?? '';
    this.newPostContent = this.editingPost?.content ?? '';
    this.selectedCategory = this.editingPost?.category ?? '';
    this.address = this.editingPost?.location?.address ?? '';
    this.neighborhood = this.editingPost?.location?.neighborhoodName ?? '';
    this.selectedImportance = this.editingPost?.importance === 'CRITICA' ? 'ALTA' : this.editingPost?.importance ?? 'MEDIA';
    this.selectedStateId = '';
    this.selectedCityId = '';
    this.selectedEvidences = [];
    this.errorMessage = '';
  }

  get selectedState(): BrazilState | undefined {
    return this.states().find((state) => String(state.id) === this.selectedStateId);
  }

  get selectedCity(): BrazilCity | undefined {
    return this.cities().find((city) => String(city.id) === this.selectedCityId);
  }

  private loadStates(): void {
    if (this.states().length || this.isLoadingStates()) return;

    this.isLoadingStates.set(true);
    this.locationErrorMessage = '';
    this.localityService
      .findStates()
      .pipe(
        finalize(() => this.isLoadingStates.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (states) => this.states.set(states),
        error: () => {
          this.locationErrorMessage =
            'Não foi possível carregar os estados. Tente novamente.';
        },
      });
  }

  private loadCities(stateId: string): void {
    this.isLoadingCities.set(true);
    this.locationErrorMessage = '';
    this.localityService
      .findCitiesByState(stateId)
      .pipe(
        finalize(() => this.isLoadingCities.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (cities) => this.cities.set(cities),
        error: () => {
          this.locationErrorMessage =
            'Não foi possível carregar as cidades. Tente novamente.';
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;
      if (Array.isArray(apiMessage)) return apiMessage.join(' ');
      if (typeof apiMessage === 'string') return apiMessage;
    }
    return error instanceof Error
      ? error.message
      : 'Não foi possível publicar a ocorrência. Tente novamente.';
  }

  private getPostTitle(content: string): string {
    return content.length > 72 ? `${content.slice(0, 69)}...` : content;
  }
}
