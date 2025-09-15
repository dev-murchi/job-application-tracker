import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { MobileNavbar } from '../../shared/components/mobile-navbar/mobile-navbar';
import { Topbar } from './components/topbar/topbar';


@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, Sidebar, MobileNavbar, Topbar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css'
})
export class DashboardLayout {
  sidebarItems = [
    { text: 'Dashboard', link: '/dashboard', icon: undefined },
    { text: 'Create Job', link: '/dashboard/create-job', icon: undefined },
    { text: 'All Jobs', link: '/dashboard/all-jobs', icon: undefined },
    { text: 'Stats', link: '/dashboard/stats', icon: undefined },
  ];

  mobileMenuLinks = [
    { text: 'Dashboard', link: '/dashboard', icon: undefined },
    { text: 'Create Job', link: '/dashboard/create-job', icon: undefined },
    { text: 'All Jobs', link: '/dashboard/all-jobs', icon: undefined },
    { text: 'Stats', link: '/dashboard/stats', icon: undefined },
    { text: 'Profile', link: '/dashboard/profile', icon: undefined },
  ];
}
