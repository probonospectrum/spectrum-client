import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { TranslatePipe } from './translate.pipe';

@Component({ imports: [TranslatePipe], template: `{{ 'Configurações' | translate }}` })
class TranslationExample {}

describe('I18nService', () => {
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({}); });
  afterEach(() => { localStorage.clear(); document.documentElement.lang = 'pt-BR'; });

  it('defaults to Portuguese and restores the last valid language', () => {
    localStorage.setItem('spectrum.language', 'es');
    expect(TestBed.inject(I18nService).language()).toBe('es');
    TestBed.resetTestingModule();
    localStorage.setItem('spectrum.language', 'invalid');
    expect(TestBed.inject(I18nService).language()).toBe('pt-BR');
  });

  it('updates existing views immediately, persists the preference and sets the document language', () => {
    const fixture = TestBed.createComponent(TranslationExample);
    const i18n = TestBed.inject(I18nService);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('Configurações');
    i18n.setLanguage('en-US');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('Settings');
    expect(document.documentElement.lang).toBe('en-US');
    i18n.setLanguage('es');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('Configuración');
    expect(localStorage.getItem('spectrum.language')).toBe('es');
  });

  it('preserves unknown content and interpolated names and supports existing unaccented labels', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en-US');
    expect(i18n.translate('Abrir opcoes da conta')).toBe('Open account options');
    expect(i18n.translate('Meu relato original')).toBe('Meu relato original');
    expect(i18n.translate('{actor} criou esta ocorrência.', { actor: 'João {actor}' })).toBe('João {actor} created this issue.');
  });
});
