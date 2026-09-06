import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CityService } from '../../../core/services/city/city.service';
import { UserService } from '../../../core/services/user/user.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                mode: 'login',
              },
            },
          },
        },
        {
          provide: CityService,
          useValue: {
            findStates: () => of([]),
            findCitiesByState: () => of([]),
          },
        },
        {
          provide: UserService,
          useValue: {
            login: () => of(null),
            create: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
