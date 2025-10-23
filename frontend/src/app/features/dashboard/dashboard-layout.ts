import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { MobileNavbar } from '../../shared/components/mobile-navbar/mobile-navbar';
import { Topbar } from './components/topbar/topbar';
import { NavLink } from '../../shared/types/nav-link.data';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, Sidebar, MobileNavbar, Topbar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css'
})
export class DashboardLayout {
  sidebarItems: NavLink[] = [
    { text: 'Dashboard', link: '/dashboard', icon: 'dashboardIcon' },
    { text: 'Add Job', link: '/dashboard/create-job', icon: 'addJobApplicationIcon' },
    { text: 'All Jobs', link: '/dashboard/jobs', icon: 'appliedJobsIcon' },
    { text: 'Statistics', link: '/dashboard/stats', icon: 'monitoringIcon' },
  ];

  mobileMenuLinks: NavLink[] = [
    { text: 'Dashboard', link: '/dashboard', icon: 'dashboardIcon' },
    { text: 'Add Job', link: '/dashboard/create-job', icon: 'addJobApplicationIcon' },
    { text: 'All Jobs', link: '/dashboard/jobs', icon: 'appliedJobsIcon' },
    { text: 'Statistics', link: '/dashboard/stats', icon: 'monitoringIcon' },
    { text: 'Profile', link: '/dashboard/profile', icon: 'accountCircleIcon' },
  ];
}
