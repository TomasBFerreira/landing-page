/** Icons that are PNGs; everything else in public/icons is an SVG. */
const PNG_ICONS = new Set(['mcc', 'wedding']);

export function iconUrl(key: string): string {
  return `icons/${key}.${PNG_ICONS.has(key) ? 'png' : 'svg'}`;
}
