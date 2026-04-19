import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FLAGSHIP_PROJECTS, FlagshipProject } from './projects';

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.scss',
})
export class ShowcaseComponent {
  projects: FlagshipProject[] = FLAGSHIP_PROJECTS;
}
