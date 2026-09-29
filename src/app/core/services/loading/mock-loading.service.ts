import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MockLoadingService {
  readonly delayMs = 500;

  load<T>(factory: () => T): Observable<T> {
    return timer(this.delayMs).pipe(map(() => factory()));
  }
}
