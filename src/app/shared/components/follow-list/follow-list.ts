import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, input, output, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { FollowUserSummary, UserService } from '../../../core/services/user/user.service';
import { UserAvatar } from '../user-avatar/user-avatar';
@Component({
  selector: 'app-follow-list',
  imports: [RouterLink, UserAvatar],
  templateUrl: './follow-list.html',
  styleUrl: './follow-list.scss',
})
export class FollowList implements OnInit, AfterViewInit {
  readonly userId = input.required<string>();
  readonly type = input.required<'followers' | 'following'>();
  readonly own = input(false);
  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly users = signal<FollowUserSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly saving = signal<string | null>(null);
  private readonly service = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  readonly currentId = this.service.currentUser()?._id;
  readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return this.users().filter(user => (user.name + ' ' + user.nickname).toLocaleLowerCase().includes(term));
  });
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  ngOnInit(): void { this.load(); }
  ngAfterViewInit(): void { this.dialog.nativeElement.showModal(); }
  @HostListener('document:keydown.escape', ['$event'])
  escape(event: Event): void { event.preventDefault(); this.closed.emit(); }
  backdrop(event: MouseEvent): void { if (event.target === this.dialog.nativeElement) this.closed.emit(); }
  load(): void {
    this.error.set(''); this.loading.set(true);
    this.service.getConnections(this.userId(), this.type()).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)),
    ).subscribe({ next: users => this.users.set(users), error: () => this.error.set('Não foi possível carregar a lista. Tente novamente.') });
  }
  act(user: FollowUserSummary): void {
    if (this.saving()) return;
    this.saving.set(user._id); this.error.set('');
    const remove = this.own() && this.type() === 'followers';
    const unfollow = user.isFollowing;
    const request: Observable<unknown> = remove ? this.service.removeFollower(user._id) : this.service.followUser(user._id, !unfollow);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(null))).subscribe({
      next: () => {
        if (remove || (this.own() && this.type() === 'following' && unfollow)) {
          this.users.update(users => users.filter(item => item._id !== user._id));
        } else {
          this.users.update(users => users.map(item => item._id === user._id ? { ...item, isFollowing: !unfollow } : item));
        }
        this.changed.emit();
      },
      error: () => this.error.set('Não foi possível atualizar. Contas privadas não aceitam novos seguidores.'),
    });
  }
}
