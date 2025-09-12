import { AfterViewInit, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Topbar } from './components/topbar/topbar';
import { MobileNavbar } from '../../shared/components/mobile-navbar/mobile-navbar';


@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Sidebar, Topbar, MobileNavbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  sidebarItems = [
    { text: 'Dashboard', link: '/dashboard', icon: '' },
    { text: 'Create Job', link: '/dashboard/create-job', icon: '' },
    { text: 'All Jobs', link: '/dashboard/all-jobs', icon: '' },
    { text: 'Stats', link: '/dashboard/stats', icon: '' },
  ];

  mobileMenuLinks = [
    { text: 'Dashboard', link: '/dashboard', icon: '' },
    { text: 'Create Job', link: '/dashboard/create-job', icon: '' },
    { text: 'All Jobs', link: '/dashboard/all-jobs', icon: '' },
    { text: 'Stats', link: '/dashboard/stats', icon: '' },
    { text: 'Profile', link: '/dashboard/profile', icon: '' },
    { text: 'Logout', link: '/auth/logout', icon: '' },
  ];
}
