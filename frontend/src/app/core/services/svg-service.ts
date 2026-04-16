import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { svgConfig, SvgNameType } from '../../svg.config';

@Injectable({
  providedIn: 'root',
})
export class SvgService {
  private readonly http = inject(HttpClient);

  // Cache the Observable so we de-dupe in-flight requests and memoize results.
  private readonly svg$Cache = new Map<SvgNameType, Observable<string | null>>();

  getSvg$(name: SvgNameType): Observable<string | null> {
    const cached$ = this.svg$Cache.get(name);
    if (cached$) {
      return cached$;
    }

    const url = svgConfig[name];
    const request$ = this.http.get(url, { responseType: 'text' }).pipe(
      map(svgText => this.normalizeSvg(svgText)),
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.svg$Cache.set(name, request$);
    return request$;
  }

  private normalizeSvg(svgText: string): string | null {
    const trimmed = svgText.trim();
    if (!trimmed) {
      return null;
    }

    // Prefer DOM-based normalization so we only ever inject a sanitized <svg> element.
    let doc: Document;
    try {
      doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml');
    } catch {
      return null;
    }

    if (doc.getElementsByTagName('parsererror').length > 0) {
      return null;
    }

    const root = doc.documentElement;
    if (!root || root.tagName.toLowerCase() !== 'svg') {
      return null;
    }

    // Remove disallowed elements.
    const scripts = Array.from(root.getElementsByTagName('script'));
    for (const el of scripts) {
      el.remove();
    }

    const foreignObjects = Array.from(root.getElementsByTagName('foreignObject'));
    for (const el of foreignObjects) {
      el.remove();
    }

    // Remove obvious active content / JS URLs.
    const allElements = [root, ...Array.from(root.querySelectorAll('*'))];
    for (const el of allElements) {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if ((name === 'href' || name === 'xlink:href') && value.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    }

    return new XMLSerializer().serializeToString(root);
  }
}
