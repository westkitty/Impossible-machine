// src/three/runtime-policy.js
// Pure, local-only runtime policy for adaptive Three.js rendering.

export const QUALITY_TIERS = Object.freeze({
  ECO: Object.freeze({ name: 'ECO', dprCap: 1.0, targetFrameMs: 1000 / 30, parallaxScale: 0.58 }),
  STANDARD: Object.freeze({ name: 'STANDARD', dprCap: 1.25, targetFrameMs: 0, parallaxScale: 0.82 }),
  HIGH: Object.freeze({ name: 'HIGH', dprCap: 1.75, targetFrameMs: 0, parallaxScale: 1 })
});

const finite = (value, fallback = null) => Number.isFinite(value) ? value : fallback;

export function selectQualityTier(profile = {}) {
  const reducedMotion = profile.reducedMotion === true;
  if (reducedMotion) return 'ECO';

  const dpr = Math.max(1, finite(profile.devicePixelRatio, 1));
  const hardwareConcurrency = finite(profile.hardwareConcurrency);
  const deviceMemory = finite(profile.deviceMemory);
  const pixelArea = Math.max(0, finite(profile.pixelArea, 0));
  const effectivePixels = pixelArea * dpr * dpr;

  if (
    (hardwareConcurrency != null && hardwareConcurrency <= 4)
    || (deviceMemory != null && deviceMemory <= 4)
    || effectivePixels > 5_000_000
  ) return 'ECO';

  const hasStrongCpu = hardwareConcurrency != null && hardwareConcurrency >= 8;
  const hasStrongMemory = deviceMemory != null && deviceMemory >= 8;
  const moderateViewport = effectivePixels > 0 && effectivePixels <= 3_000_000;

  if (hasStrongCpu && hasStrongMemory && moderateViewport) return 'HIGH';
  return 'STANDARD';
}

export function pixelRatioForTier(tier, devicePixelRatio = 1) {
  const policy = QUALITY_TIERS[tier] || QUALITY_TIERS.STANDARD;
  return Math.min(Math.max(1, finite(devicePixelRatio, 1)), policy.dprCap);
}

export function targetFrameMsForTier(tier) {
  return (QUALITY_TIERS[tier] || QUALITY_TIERS.STANDARD).targetFrameMs;
}

export function parallaxScaleForTier(tier) {
  return (QUALITY_TIERS[tier] || QUALITY_TIERS.STANDARD).parallaxScale;
}

export function composePauseReasons({
  contextLost = false,
  documentHidden = false,
  viewportVisible = true
} = {}) {
  const reasons = [];
  if (contextLost) reasons.push('context-lost');
  if (documentHidden) reasons.push('document-hidden');
  if (viewportVisible === false) reasons.push('offscreen');
  return Object.freeze(reasons);
}
