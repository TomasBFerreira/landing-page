import { EDGES, HOSTS, NODES, STEPS, STEP_ITEMS } from './topology.data';
import { layoutDiagram } from './diagram-layout';
import { INVENTORY } from './inventory.data';
import { SERVICES } from '../services.config';

describe('topology data', () => {
  const ids = [...NODES.map(n => n.id), ...HOSTS.map(h => h.id)];

  it('has unique ids', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only connects edges between known nodes or hosts', () => {
    const known = new Set(ids);
    for (const e of EDGES) {
      expect(known.has(e.from)).withContext(e.from).toBeTrue();
      expect(known.has(e.to)).withContext(e.to).toBeTrue();
    }
  });

  it('only references known ids in the mobile steps', () => {
    const known = new Set([...ids, ...STEP_ITEMS.map(i => i.id), ...layoutDiagram().items.keys()]);
    for (const id of [...STEPS.public, ...STEPS.private]) {
      expect(known.has(id)).withContext(id).toBeTrue();
    }
  });

  it('only links items to services that exist', () => {
    const services = new Set(SERVICES.map(s => s.id));
    const linked = [...NODES, ...HOSTS.map(h => h as { serviceId?: string; id: string }), ...STEP_ITEMS,
      ...Object.values(INVENTORY).flatMap(h => [...h.lxcs, ...h.vm.apps])];
    for (const i of linked) {
      const sid = (i as { serviceId?: string }).serviceId;
      if (sid) expect(services.has(sid)).withContext(sid).toBeTrue();
    }
  });

  it('does not expose IPs or VMIDs', () => {
    const text = JSON.stringify({ NODES, HOSTS, EDGES, INVENTORY });
    expect(text).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    expect(text).not.toMatch(/VMID|CT ?\d{3}/i);
  });
});
