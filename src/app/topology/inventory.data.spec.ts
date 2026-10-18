import { INVENTORY, inventoryCounts, inventoryIcons } from './inventory.data';
import { HOSTS } from './topology.data';
import { SERVICES } from '../services.config';

describe('inventory data', () => {
  it('has an inventory for every host in the map', () => {
    for (const h of HOSTS) expect(INVENTORY[h.id]).withContext(h.id).toBeDefined();
  });

  it('has unique container and app names within a host', () => {
    for (const [host, inv] of Object.entries(INVENTORY)) {
      const lxc = inv.lxcs.map(l => l.name);
      const apps = inv.vm.apps.map(a => a.name);
      expect(new Set(lxc).size).withContext(`${host} lxcs`).toBe(lxc.length);
      expect(new Set(apps).size).withContext(`${host} apps`).toBe(apps.length);
    }
  });

  it('only references services that exist', () => {
    const ids = new Set(SERVICES.map(s => s.id));
    for (const inv of Object.values(INVENTORY)) {
      for (const item of [...inv.lxcs, ...inv.vm.apps]) {
        if (item.serviceId) expect(ids.has(item.serviceId)).withContext(item.name).toBeTrue();
      }
    }
  });

  it('never offers an Open link for Traefik or Authentik', () => {
    for (const inv of Object.values(INVENTORY)) {
      for (const l of inv.lxcs.filter(x => x.serviceId === 'traefik' || x.serviceId === 'authentik')) {
        expect(l.noLink).withContext(l.name).toBeTrue();
      }
    }
  });

  it('does not expose IPs, VMIDs or blue/green slot names', () => {
    const text = JSON.stringify(INVENTORY);
    expect(text).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    expect(text).not.toMatch(/VMID|CT ?\d{3}|blue.?green|\bslot/i);
  });

  it('counts only running containers', () => {
    const c = inventoryCounts(INVENTORY['benedict']);
    const stopped = INVENTORY['benedict'].lxcs.filter(l => l.state === 'stopped').length;
    expect(c.lxcs).toBe(INVENTORY['benedict'].lxcs.length - stopped);
    expect(stopped).toBeGreaterThan(0);
  });

  it('keeps the vendored icon set in sync', () => {
    // Update this list when adding a file to public/icons (the build serves them as-is).
    const vendored = new Set([
      'adguard-home', 'alloy', 'angular', 'ansible', 'authentik', 'clickhouse', 'cloudflare', 'directus', 'github',
      'golang', 'grafana', 'jellyseerr', 'k3s', 'loki', 'minecraft', 'mosquitto', 'nextcloud', 'nginx', 'nvidia',
      'opentelemetry', 'pi-hole', 'postgresql', 'prometheus', 'prowlarr', 'proxmox-backup-server', 'qbittorrent',
      'radarr', 'rancher', 'redis', 'semaphore', 'signoz', 'sonarr', 'svelte', 'tailscale', 'telegraf', 'tempo',
      'traefik', 'vault', 'wikijs', 'wireguard', 'zigbee2mqtt',
    ]);
    for (const k of inventoryIcons()) expect(vendored.has(k)).withContext(k).toBeTrue();
  });
});
