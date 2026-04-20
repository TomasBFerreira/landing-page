import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InfraDiagramComponent } from '../infra-diagram/infra-diagram.component';
import { ServicesGridComponent } from '../services-grid/services-grid.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, InfraDiagramComponent, ServicesGridComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
