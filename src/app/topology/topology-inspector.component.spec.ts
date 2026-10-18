import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TopologyInspectorComponent } from './topology-inspector.component';

describe('TopologyInspectorComponent', () => {
  let fixture: ComponentFixture<TopologyInspectorComponent>;

  function render(hostId: string): HTMLElement {
    fixture = TestBed.createComponent(TopologyInspectorComponent);
    fixture.componentRef.setInput('mode', 'public');
    fixture.componentRef.setInput('hostId', hostId);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [TopologyInspectorComponent], providers: [provideHttpClient()] }));

  it('offers Open links on the prod host', () => {
    expect(render('betsy').querySelectorAll('a.card__open').length).toBeGreaterThan(0);
  });

  it('never links dev or QA cards to prod hostnames', () => {
    expect(render('benedict').querySelectorAll('a.card__open').length).toBe(0);
    expect(render('heaton').querySelectorAll('a.card__open').length).toBe(0);
  });

  it('does not light any dev or QA card on the public path', () => {
    for (const host of ['benedict', 'heaton']) {
      expect(render(host).querySelectorAll('article.card[data-state="lit"]').length).withContext(host).toBe(0);
    }
  });

  it('lights the prod Cloudflared card on the public path', () => {
    const lit = Array.from(render('betsy').querySelectorAll('article.card[data-state="lit"] .card__name')).map(n => n.textContent?.trim());
    expect(lit).toContain('cloudflared');
  });

  it('does not link Traefik or Authentik on prod', () => {
    const root = render('betsy');
    for (const card of Array.from(root.querySelectorAll('article.card'))) {
      const name = card.querySelector('.card__name')?.textContent?.trim();
      if (name === 'traefik' || name === 'sso') expect(card.querySelector('a.card__open')).withContext(name).toBeNull();
    }
  });
});
