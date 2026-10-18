import { EDGES, HOSTS, NODES, STEPS, STEP_ITEMS, HOST_H, hostContentHeight } from './topology.data';
import { SERVICES } from '../services.config';

describe('topology data', () => {
  const ids = [
    ...NODES.map(n => n.id),
    ...HOSTS.flatMap(h => [h.id, ...h.chips.map(c => c.id)]),
  ];

  it('has unique ids', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only connects edges between known nodes or hosts', () => {
    const known = new Set([...NODES.map(n => n.id), ...HOSTS.map(h => h.id)]);
    for (const e of EDGES) {
      expect(known.has(e.from)).withContext(e.from).toBeTrue();
      expect(known.has(e.to)).withContext(e.to).toBeTrue();
    }
  });

  it('only references known ids in the mobile steps', () => {
    const known = [...ids, ...STEP_ITEMS.map(i => i.id)];
    for (const id of [...STEPS.public, ...STEPS.private]) {
      expect(known).withContext(id).toContain(id);
    }
  });

  it('only links chips to services that exist', () => {
    const services = new Set(SERVICES.map(s => s.id));
    for (const c of HOSTS.flatMap(h => h.chips)) {
      if (c.serviceId) expect(services.has(c.serviceId)).withContext(c.id).toBeTrue();
    }
  });

  it('does not expose IPs or VMIDs', () => {
    const text = JSON.stringify({ NODES, HOSTS, EDGES });
    expect(text).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    expect(text).not.toMatch(/VMID|CT ?\d{3}/i);
  });

  it('fits every host\'s chips inside the host box', () => {
    for (const h of HOSTS) {
      expect(hostContentHeight(h.chips)).withContext(h.name).toBeLessThanOrEqual(HOST_H);
    }
  });

  it('does not light dev or QA chips on the public path', () => {
    for (const h of HOSTS.filter(x => x.env !== 'prod')) {
      for (const c of h.chips) expect(c.paths).withContext(c.id).not.toContain('public');
    }
  });
});
