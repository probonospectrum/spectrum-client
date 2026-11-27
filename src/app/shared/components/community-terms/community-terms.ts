import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { CommunityTermsService } from '../../../core/services/user/community-terms.service';

@Component({
  selector: 'app-community-terms',
  templateUrl: './community-terms.html',
  styleUrl: './community-terms.scss',
})
export class CommunityTerms {
  protected readonly terms = inject(CommunityTermsService);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (this.terms.prompt()) {
        this.error.set('');
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  protected async accept(): Promise<void> {
    const prompt = this.terms.prompt();
    if (!prompt || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await prompt.accept();
      this.terms.prompt.set(null);
    } catch {
      this.error.set('Não foi possível registrar o aceite. Confira sua conexão e tente novamente.');
    } finally {
      this.busy.set(false);
    }
  }

  protected refuse(): void {
    if (this.busy()) return;
    this.terms.prompt()?.refuse();
    this.terms.prompt.set(null);
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    if (this.busy()) return;
    this.terms.prompt()?.cancel();
    this.terms.prompt.set(null);
  }
}
