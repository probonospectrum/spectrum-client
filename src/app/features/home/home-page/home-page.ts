import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../../shared/components/button/button';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-home-page',
  imports: [Button],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user: LoggedUser | null = this.userService.getCurrentUser();

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }
}
