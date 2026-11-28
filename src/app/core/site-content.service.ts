import { inject, Injectable, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { ApiService } from './api.service';
import {
  SiteContent,
  withContentDefaults,
} from './site-content';

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly api = inject(ApiService);
  private readonly state = signal<SiteContent>(withContentDefaults());
  private loaded = false;
  private pending?: Observable<SiteContent>;

  readonly content = this.state.asReadonly();

  load(force = false): Observable<SiteContent> {
    if (this.loaded && !force) {
      return of(this.state());
    }

    if (!this.pending) {
      this.pending = this.api
        .get<{ content: SiteContent }>('/site/content')
        .pipe(
          map((response) => withContentDefaults(response.content)),
          tap((content) => {
            this.state.set(content);
            this.loaded = true;
          }),
          catchError(() => {
            this.loaded = true;
            return of(this.state());
          }),
          finalize(() => {
            this.pending = undefined;
          }),
          shareReplay(1)
        );
    }

    return this.pending;
  }

  update(content: SiteContent): Observable<SiteContent> {
    return this.api
      .put<{ content: SiteContent }>('/site/content', { content })
      .pipe(
        map((response) => withContentDefaults(response.content)),
        tap((next) => {
          this.state.set(next);
          this.loaded = true;
        })
      );
  }
}
