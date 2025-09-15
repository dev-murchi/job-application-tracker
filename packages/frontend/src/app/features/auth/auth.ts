import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { startWith } from 'rxjs';
import { ThemeSwitch } from '../../shared/components/theme-switch/theme-switch';

@Component({
  standalone: true,
  selector: 'app-auth',
  imports: [CommonModule, RouterOutlet, RouterLink, ThemeSwitch],
  templateUrl: './auth.html'
})
export class Auth implements OnInit {
  promptText = '';
  linkText = '';
  linkUrl = '';

  private router = inject(Router);

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    ).subscribe((event: NavigationEnd) => {
      const path = event.urlAfterRedirects.split('/').pop();
      this.updatePrompt(path);
    });
  }

  private updatePrompt(path: string | undefined) {
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