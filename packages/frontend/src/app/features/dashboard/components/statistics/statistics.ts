import { Component } from '@angular/core';
import { Register } from '../../../auth/components/register/register';

@Component({
  selector: 'app-statistics',
  imports: [Register],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css'
})
export class Statistics {

  private jobs = [
    { id: 1, position: 'Software Engineer', company: 'Google', location: 'Mountain View, CA', status: 'interview' },
    { id: 2, position: 'Product Manager', company: 'Microsoft', location: 'Redmond, WA', status: 'pending' },
    { id: 3, position: 'UX Designer', company: 'Amazon', location: 'Seattle, WA', status: 'declined' },
    { id: 4, position: 'Data Scientist', company: 'Netflix', location: 'Los Gatos, CA', status: 'pending' },
    { id: 5, position: 'Frontend Developer', company: 'Meta', location: 'Menlo Park, CA', status: 'interview' },
  ];
 pendingCount = this.jobs.filter(j => j.status === 'pending').length;
 interviewCount = this.jobs.filter(j => j.status === 'interview').length;
 declinedCount = this.jobs.filter(j => j.status === 'declined').length;

}
