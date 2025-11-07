/* eslint-disable no-bitwise */
export const TYPE_CHIP_STYLES = {
  feature: { bg: '#0366d6', color: '#ffffff' },
  'bug-fix': { bg: '#d73a49', color: '#ffffff' },
  hotfix: { bg: '#b31d28', color: '#ffffff' },
  deploy: { bg: '#6f42c1', color: '#ffffff' },
  rollback: { bg: '#e36209', color: '#ffffff' },
  'db-migration': { bg: '#005cc5', color: '#ffffff' },
  'code-review': { bg: '#6a737d', color: '#e36209' },
  performance: { bg: '#2188ff', color: '#ffffff' },
  roadmap: { bg: '#0a5e2a', color: '#ffffff' },
  spec: { bg: '#2cbe4e', color: '#ffffff' }, 
  research: { bg: '#00a3bf', color: '#f1e05a' },
  testing: { bg: '#f1e05a', color: '#000000' },
  design: { bg: '#ff7b72', color: '#ffffff' },
  registered: { bg: '#fbca04', color: '#000000' }, 
  content: { bg: '#6f42c1', color: '#ffffff' },
  social: { bg: '#1da1f2', color: '#ffffff' },
  campaign: { bg: '#fb6a2a', color: '#ffffff' }, 
  experiment: { bg: '#20c997', color: '#ffffff' },
  support: { bg: '#6a737d', color: '#ffffff' },
  onboarding: { bg: '#2f80ed', color: '#ffffff' },
  partners: { bg: '#6f42c1', color: '#ffffff' },
  incident: { bg: '#d73a49', color: '#ffffff' },
  monitor: { bg: '#ffb84d', color: '#000000' },
  backup: { bg: '#6f42c1', color: '#ffffff' },
  security: { bg: '#24292e', color: '#ffffff' },
  config: { bg: '#0366d6', color: '#ffffff' },
  automation: { bg: '#0a66c2', color: '#ffffff' },
  legal: { bg: '#8b5cf6', color: '#ffffff' },
  finance: { bg: '#0f766e', color: '#ffffff' },
  hr: { bg: '#ef4444', color: '#ffffff' },
  meeting: { bg: '#94a3b8', color: '#000000' },
  training: { bg: '#0ea5a4', color: '#ffffff' },
  joined: { bg: '#2b9348', color: '#ffffff' },
  report: { bg: '#005f73', color: '#ffffff' },
};

export const getChipStyle = (type) =>
  TYPE_CHIP_STYLES[type] || { bg: '#6a737d', color: '#ffffff' };

// --------- Helpers: convert hex -> rgba and create very pale, low-saturation chip styles
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}
function hexToRgba(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Create a very pale background + faint border and readable text for small chips
export function getChipSxFromBase(baseHex, opts = {}) {
  const bgAlpha = typeof opts.bgAlpha === 'number' ? opts.bgAlpha : 0.06; // 0.04 - 0.12 recommended
  const borderAlpha =
    typeof opts.borderAlpha === 'number' ? opts.borderAlpha : 0.14;
  const text = opts.forceTextColor ?? 'text.primary'; // prefer dark text for pale backgrounds

  return {
    backgroundColor: hexToRgba(baseHex, bgAlpha),
    color: text,
    border: `1px solid ${hexToRgba(baseHex, borderAlpha)}`,
    fontWeight: 300,
    height: 24,
    fontSize: '0.50rem',
    ml: 0,
  };
}
