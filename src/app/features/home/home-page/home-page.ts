import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user: LoggedUser | null = this.userService.getCurrentUser();
  readonly currentDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  get displayName(): string {
    return this.user?.name || 'Usuario Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return (this.displayName || this.nickname).charAt(0).toUpperCase();
  }

  get followingCount(): number {
    return this.user?.following?.length ?? 0;
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }
}
