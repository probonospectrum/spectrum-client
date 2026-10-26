import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { PublicAgencyService, AgencyStatus } from '../../core/services/user/public-agency.service';
import { UserService } from '../../core/services/user/user.service';
import { PublicAgencyPage } from './public-agency-page';

describe('PublicAgencyPage email verification notice', () => {
  let fixture: ComponentFixture<PublicAgencyPage>;
  const account: AgencyStatus = {
    accountType: 'PUBLIC_AGENCY',
    isVerified: false,
    occurrenceRole: 'USER',
    agencyRegistration: {
      status: 'PENDING',
      cnpj: '12ABC34501DE35',
      name: 'Secretaria Municipal',
      position: 'Diretora',
      authorizationReference: 'Portaria municipal 123/2026',
    },
  };
  const resend = vi.fn(() => of({ message: 'E-mail já confirmado.', isVerified: true }));
  const status = vi.fn(() => of(account));

  beforeEach(async () => {
    resend.mockClear();
    status.mockReset().mockReturnValue(of(account));
    await TestBed.configureTestingModule({
      imports: [PublicAgencyPage],
      providers: [
        provideRouter([]),
        {
          provide: PublicAgencyService,
          useValue: { status, assigned: () => of([]), resend },
        },
        {
          provide: UserService,
          useValue: {
            getCurrentUser: () => ({ email: 'responsavel@prefeitura.gov.br' }),
            token: () => null,
            currentUser: () => null,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicAgencyPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows the responsible email until verification is confirmed, then removes resend', () => {
    const pageText = () => fixture.nativeElement.textContent as string;
    const resendButton = () =>
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find((button) => button.textContent?.includes('Reenviar confirmação'));

    expect(pageText()).toContain('responsavel@prefeitura.gov.br');
    expect(pageText()).toContain('Aguardando confirmação do e-mail');
    expect(resendButton()).toBeTruthy();

    fixture.componentInstance.resend();
    fixture.detectChanges();

    expect(resend).toHaveBeenCalledOnce();
    expect(pageText()).toContain('E-mail do responsável validado com sucesso.');
    expect(pageText()).toContain('Aguardando análise da moderação');
    expect(pageText()).not.toContain('Aguardando confirmação do e-mail');
    expect(resendButton()).toBeUndefined();
  });

  it('refreshes pending verification when the user returns to the page', async () => {
    status.mockReturnValueOnce(of({ ...account, isVerified: true }));

    fixture.componentInstance.refreshVerificationStatus();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(status).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain(
      'E-mail do responsável validado com sucesso.',
    );
    expect(fixture.nativeElement.textContent).toContain('Aguardando análise da moderação');
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .some((button) => button.textContent?.includes('Reenviar confirmação')),
    ).toBe(false);
  });
});