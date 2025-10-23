import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardLayout } from './dashboard-layout';
import { MobileNavbarMock } from '../../../mocks/components/shared/components/mobile-navbar/mobile-navbar-mock';
import { SidebarMock } from '../../../mocks/components/shared/components/sidebar/sidebar-mock';
import { TopbarMock } from '../../../mocks/components/shared/components/topbar/topbar-mock';
import { MobileNavbar } from '../../shared/components/mobile-navbar/mobile-navbar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Topbar } from './components/topbar/topbar';

describe('DashboardLayout', () => {
  let component: DashboardLayout;
  let fixture: ComponentFixture<DashboardLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLayout],
      providers: [provideZonelessChangeDetection()],
    })
      .overrideComponent(DashboardLayout, {
        remove: { imports: [Sidebar, MobileNavbar, Topbar] },
        add: { imports: [SidebarMock, MobileNavbarMock, TopbarMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
