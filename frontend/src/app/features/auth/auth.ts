import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { startWith } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SvgComponent } from '../../shared/components/svg/svg';
import { ThemeSwitch } from '../../shared/components/theme-switch/theme-switch';
import { SvgNameType } from '../../svg.config';

@Component({
  standalone: true,
  selector: 'app-auth',
  imports: [CommonModule, RouterOutlet, RouterLink, ThemeSwitch, SvgComponent],
  templateUrl: './auth.html',
})
export class Auth implements OnInit {
  promptText = '';
  linkText = '';
  linkUrl = '';
  logo: SvgNameType = 'logo';

  private router = inject(Router);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(new NavigationEnd(0, this.router.url, this.router.url)),
      )
      .subscribe((event: NavigationEnd) => {
        const path = event.urlAfterRedirects.split('/').pop();
        this.updatePrompt(path);
      });
  }

  private updatePrompt(path: string | undefined): void {
    if (path === 'login') {
      this.promptText = "Don't have an account?";
      this.linkText = 'Register here';
      this.linkUrl = 'register';
    } else if (path === 'register') {
      this.promptText = 'Already have an account?';
      this.linkText = 'Login here';
      this.linkUrl = 'login';
    } else {
      this.promptText = '';
      this.linkText = '';
      this.linkUrl = '';
    }
  }
}
