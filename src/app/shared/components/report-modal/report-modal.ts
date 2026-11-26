import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { AlertPopup } from '../alert-popup/alert-popup';

export type ReportSubmission = { category: string; reason: string };

@Component({
  selector: 'app-report-modal',
  imports: [TranslatePipe, CommonModule, AlertPopup],
  templateUrl: './report-modal.html',
  styleUrl: './report-modal.scss',
})
export class ReportModal {
  /** Título do modal exibido no topo. */
  @Input() title = 'O que está sendo reportado?';
  /** Lista de motivos de denúncia. */
  @Input() reasons: string[] = [
    'Discurso de ódio',
    'Abuso ou assédio',
    'Conteúdo sexual',
    'Segurança infantil',
  ];

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  @Input() externalSubmission = false;
  @Input() submitting = false;
  @Input() submissionError = '';
  @Output() submit = new EventEmitter<ReportSubmission>();
  otherReason = '';

  get choices(): string[] { return this.reasons.includes('Outros') ? this.reasons : [...this.reasons, 'Outros']; }

  selectedReason = this.reasons[0];
  submitted = false;

  ngOnInit(): void {
    this.selectedReason = this.reasons[0];
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (!this.submitted && !this.submitting) {
      this.close.emit();
    }
  }

  select(reason: string): void {
    this.selectedReason = reason;
  }

  onConfirm(): void {
    if (this.submitting || (this.selectedReason === 'Outros' && !this.otherReason.trim())) return;
    if (this.externalSubmission) this.submit.emit({ category: this.selectedReason, reason: this.selectedReason === 'Outros' ? this.otherReason.trim() : this.selectedReason });
    else this.submitted = true;
  }

  onDone(): void {
    this.confirm.emit(this.selectedReason === 'Outros' ? this.otherReason.trim() : this.selectedReason);
  }
}
