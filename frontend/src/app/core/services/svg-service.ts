import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { svgConfig, SvgNameType } from '../../svg.config';


@Injectable({
  providedIn: 'root'
})
export class SvgService {
  private http = inject(HttpClient);
  private cache = new Map<string, string>();

  load(): Observable<boolean> {
    const observables = (Object.keys(svgConfig) as SvgNameType[]).map(iconName => {
      const url = svgConfig[iconName];
      return this.http.get(url, { responseType: 'text' }).pipe(
        tap(svg => this.cache.set(iconName, svg)),
        catchError(err => {
          console.error(`Error loading icon: ${iconName}`, err);
          return of(null);
        })
      );
    });

    return forkJoin(observables).pipe(
      map(() => true),
      catchError(() => of(false)),
      shareReplay(1)
    );
  }

  getSvg(name: SvgNameType): string | undefined {
    return this.cache.get(name);
  }
}