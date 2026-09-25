import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.scss',
})
export class SettingsDialog implements AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() description = '';
  @Output() closed = new EventEmitter<void>();
  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  private previousFocus: HTMLElement | null = null;
  private focusTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.focusTimer = setTimeout(() => this.focusFirstElement());
  }

  ngOnDestroy(): void {
    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
    }

    this.previousFocus?.focus();
  }

  @HostListener('document:keydown.escape')
  closeFromEscape(): void {
    this.close();
  }

  @HostListener('document:keydown.tab', ['$event'])
  keepFocusInside(event: Event): void {
    const panel = this.panel?.nativeElement;
    const focusable = this.getFocusableElements();
    const keyboardEvent = event as KeyboardEvent;

    if (!panel || !focusable.length) {
      event.preventDefault();
      panel?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const focusOutside = !panel.contains(document.activeElement);

    if (keyboardEvent.shiftKey && (document.activeElement === first || focusOutside)) {
      event.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && (document.activeElement === last || focusOutside)) {
      event.preventDefault();
      first.focus();
    }
  }

  close(): void {
    this.closed.emit();
  }

  private focusFirstElement(): void {
    const panel = this.panel?.nativeElement;
    const focusTarget =
      panel?.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      ) ?? this.getFocusableElements()[0];

    (focusTarget ?? panel)?.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    return [
      ...(this.panel?.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ];
  }
}
