import { Component, input, output } from '@angular/core';
import { BoxView } from './diagram-layout';
import { PathKind } from './topology.data';
import { ServiceStatus } from '../models/service.model';
import { iconUrl } from './icons';

/** One container or app in the diagram: icon, name, and its services as pills. Lives on an SVG `<g>`. */
@Component({
  selector: 'g[appDiagramBox]',
  standalone: true,
  host: {
    role: 'button',
    tabindex: '0',
    '[attr.aria-label]': 'box().name',
    '[attr.data-state]': 'state()',
    '[attr.data-mode]': 'mode()',
    '[class.sel]': 'selected()',
    '[class.off]': 'box().stopped',
    '(click)': 'pick.emit(box().id)',
    '(keydown.enter)': 'pick.emit(box().id)',
    '(keydown.space)': 'pick.emit(box().id); $event.preventDefault()',
  },
  templateUrl: './diagram-box.component.html',
  styleUrl: './diagram-box.component.scss',
})
export class DiagramBoxComponent {
  readonly box = input.required<BoxView>();
  readonly state = input<'lit' | 'dim' | 'plain'>('plain');
  readonly mode = input<PathKind>('public');
  readonly selected = input(false);
  readonly status = input<ServiceStatus | null>(null);
  readonly pick = output<string>();

  readonly iconUrl = iconUrl;
  initial(name: string): string { return name.trim().charAt(0).toUpperCase(); }
}
