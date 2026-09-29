import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface DashboardBarItem {
  key: string;
  label: string;
  value: number;
  detail?: string;
  color?: string;
}

@Component({
  selector: 'app-dashboard-bar-chart',
  templateUrl: './dashboard-bar-chart.html',
  styleUrl: './dashboard-bar-chart.scss',
})
export class DashboardBarChart {
  @Input({ required: true }) items: DashboardBarItem[] = [];
  @Input() emptyLabel = 'Nenhum dado para os filtros selecionados.';
  @Output() itemSelected = new EventEmitter<string>();

  get maxValue(): number {
    return Math.max(...this.items.map((item) => item.value), 0);
  }

  widthFor(value: number): number {
    return this.maxValue > 0 ? Math.max((value / this.maxValue) * 100, 2) : 0;
  }
}
