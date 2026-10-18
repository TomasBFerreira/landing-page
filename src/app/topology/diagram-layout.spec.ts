import { BoxView, Rect, layoutDiagram } from './diagram-layout';
import { HOSTS, VIEW_W } from './topology.data';
import { INVENTORY } from './inventory.data';

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x - 0.01 && inner.y >= outer.y - 0.01 &&
  inner.x + inner.w <= outer.x + outer.w + 0.01 && inner.y + inner.h <= outer.y + outer.h + 0.01;

const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('diagram layout', () => {
  const layout = layoutDiagram();

  it('places every inventory container and app', () => {
    for (const h of layout.hosts) {
      const inv = INVENTORY[h.host.id];
      expect(h.lxcs.length).withContext(h.host.id).toBe(inv.lxcs.length);
      expect(h.vm.apps.length).withContext(h.host.id).toBe(inv.vm.apps.length);
    }
  });

  it('keeps hosts inside the canvas and the same height', () => {
    for (const h of layout.hosts) {
      expect(h.rect.x).toBeGreaterThanOrEqual(0);
      expect(h.rect.x + h.rect.w).toBeLessThanOrEqual(VIEW_W);
      expect(h.rect.h).toBe(layout.hosts[0].rect.h);
    }
    expect(layout.height).toBeGreaterThan(layout.hosts[0].rect.y + layout.hosts[0].rect.h);
  });

  it('keeps boxes inside their host and the VM box', () => {
    for (const h of layout.hosts) {
      for (const b of h.lxcs) expect(inside(b.rect, h.rect)).withContext(b.id).toBeTrue();
      expect(inside(h.vm.rect, h.rect)).withContext(h.vm.id).toBeTrue();
      for (const b of h.vm.apps) expect(inside(b.rect, h.vm.rect)).withContext(b.id).toBeTrue();
    }
  });

  it('never overlaps boxes in the same section', () => {
    for (const h of layout.hosts) {
      for (const group of [h.lxcs, h.vm.apps]) {
        group.forEach((a, i) => group.slice(i + 1).forEach(b =>
          expect(overlap(a.rect, b.rect)).withContext(`${a.id} vs ${b.id}`).toBeFalse()));
      }
      for (const b of h.lxcs) expect(overlap(b.rect, h.vm.rect)).withContext(b.id).toBeFalse();
    }
  });

  it('keeps every service pill inside its box', () => {
    const check = (b: BoxView) => {
      for (const p of b.pills) {
        expect(p.x).withContext(`${b.id}/${p.label}`).toBeGreaterThanOrEqual(b.rect.x);
        expect(p.x + p.w).withContext(`${b.id}/${p.label}`).toBeLessThanOrEqual(b.rect.x + b.rect.w);
        expect(p.y + 20).withContext(`${b.id}/${p.label}`).toBeLessThanOrEqual(b.rect.y + b.rect.h);
      }
    };
    for (const h of layout.hosts) { h.lxcs.forEach(check); h.vm.apps.forEach(check); }
  });

  it('has a detail item for everything clickable, and unique ids', () => {
    const ids: string[] = [];
    for (const h of layout.hosts) {
      ids.push(h.host.id, h.vm.id, ...h.lxcs.map(b => b.id), ...h.vm.apps.map(b => b.id));
    }
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(layout.items.has(id)).withContext(id).toBeTrue();
    expect(HOSTS.length).toBe(layout.hosts.length);
  });

  it('puts dev and QA boxes on the private path only', () => {
    for (const h of layout.hosts.filter(x => x.host.env !== 'prod')) {
      for (const b of [...h.lxcs, ...h.vm.apps]) expect(b.paths).withContext(b.id).not.toContain('public');
    }
  });
});
