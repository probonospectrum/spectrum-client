import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface DashboardTimelineItem {
  date: string;
  count: number;
}

interface PlottedPoint extends DashboardTimelineItem {
  x: number;
  y: number;
}

@Component({
  selector: 'app-dashboard-line-chart',
  templateUrl: './dashboard-line-chart.html',
  styleUrl: './dashboard-line-chart.scss',
})
export class DashboardLineChart {
  @Input({ required: true }) points: DashboardTimelineItem[] = [];
  @Output() pointSelected = new EventEmitter<string>();

  readonly width = 600;
  readonly height = 210;
  readonly padding = 24;

  get plottedPoints(): PlottedPoint[] {
    const max = Math.max(...this.points.map((point) => point.count), 1);
    const availableWidth = this.width - this.padding * 2;
    const availableHeight = this.height - this.padding * 2;

    return this.points.map((point, index) => ({
      ...point,
      x:
        this.points.length === 1
          ? this.width / 2
          : this.padding + (index / (this.points.length - 1)) * availableWidth,
      y: this.height - this.padding - (point.count / max) * availableHeight,
    }));
  }

  get polylinePoints(): string {
    return this.plottedPoints.map((point) => `${point.x},${point.y}`).join(' ');
  }

  get hasData(): boolean {
    return this.points.some((point) => point.count > 0);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  }

  selectWithKeyboard(event: KeyboardEvent, date: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.pointSelected.emit(date);
    }
  }
}
