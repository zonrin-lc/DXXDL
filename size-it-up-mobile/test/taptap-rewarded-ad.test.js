import { describe, it, expect, vi } from 'vitest';
import { createTapTapRewardedAd } from '../src/platform/taptap-rewarded-ad.js';

function fakePlatform({ onShow } = {}) {
  const handlers = {};
  const ad = {
    onLoad: vi.fn((fn) => { handlers.load = fn; }),
    onError: vi.fn((fn) => { handlers.error = fn; }),
    onClose: vi.fn((fn) => { handlers.close = fn; }),
    load: vi.fn(() => {
      handlers.load?.();
      return Promise.resolve();
    }),
    show: vi.fn(() => {
      onShow?.(handlers);
      return Promise.resolve();
    }),
  };
  return {
    ad,
    sdk: { createRewardedVideoAd: vi.fn(() => ad) },
    handlers,
  };
}

describe('TapTap rewarded-video adapter', () => {
  it('does not grant reward when ad unit ID is missing', async () => {
    const f = fakePlatform();
    const manager = createTapTapRewardedAd({ adUnitId: '', getPlatform: () => f.sdk });
    expect(manager.isConfigured()).toBe(false);
    expect(await manager.showRewarded()).toMatchObject({ status: 'unavailable', reason: 'missing-ad-unit-id' });
    expect(f.sdk.createRewardedVideoAd).not.toHaveBeenCalled();
  });

  it('grants completion only when SDK close callback reports isEnded=true', async () => {
    const f = fakePlatform({ onShow: (h) => queueMicrotask(() => h.close?.({ isEnded: true })) });
    const manager = createTapTapRewardedAd({ adUnitId: 'test-ad-unit', getPlatform: () => f.sdk, now: () => 61_000, firstAdDelayMs: 0 });
    expect(await manager.showRewarded()).toEqual({ status: 'completed' });
    expect(f.sdk.createRewardedVideoAd).toHaveBeenCalledWith({ adUnitId: 'test-ad-unit' });
  });

  it('does not grant reward when player closes early', async () => {
    const f = fakePlatform({ onShow: (h) => queueMicrotask(() => h.close?.({ isEnded: false })) });
    const manager = createTapTapRewardedAd({ adUnitId: 'test-ad-unit', getPlatform: () => f.sdk, now: () => 61_000, firstAdDelayMs: 0 });
    expect(await manager.showRewarded()).toEqual({ status: 'cancelled' });
  });

  it('returns a safe error on SDK load failure', async () => {
    const f = fakePlatform();
    f.ad.load.mockImplementation(() => {
      f.handlers.error?.(new Error('no inventory'));
      return Promise.reject(new Error('no inventory'));
    });
    const manager = createTapTapRewardedAd({ adUnitId: 'test-ad-unit', getPlatform: () => f.sdk, loadTimeoutMs: 20, now: () => 61_000, firstAdDelayMs: 0 });
    expect(await manager.showRewarded()).toMatchObject({ status: 'error', reason: 'load-failed' });
  });

  it('prevents concurrent reward attempts', async () => {
    let close;
    const f = fakePlatform({ onShow: (h) => { close = h.close; } });
    const manager = createTapTapRewardedAd({ adUnitId: 'test-ad-unit', getPlatform: () => f.sdk, playbackTimeoutMs: 100, now: () => 61_000, firstAdDelayMs: 0 });
    const first = manager.showRewarded();
    await Promise.resolve();
    await Promise.resolve();
    const second = await manager.showRewarded();
    expect(second.status).toBe('busy');
    close?.({ isEnded: false });
    expect((await first).status).toBe('cancelled');
  });
  it('blocks rewarded ads during the first 60 seconds after page startup', async () => {
    let currentTime = 0;
    const f = fakePlatform({ onShow: (h) => queueMicrotask(() => h.close?.({ isEnded: true })) });
    const manager = createTapTapRewardedAd({
      adUnitId: 'test-ad-unit',
      getPlatform: () => f.sdk,
      firstAdDelayMs: 60_000,
      now: () => currentTime,
    });

    expect(manager.isConfigured()).toBe(true);
    expect(manager.isAvailable()).toBe(false);
    expect(await manager.showRewarded()).toEqual({ status: 'unavailable', reason: 'startup-delay' });
    expect(f.sdk.createRewardedVideoAd).not.toHaveBeenCalled();

    currentTime = 60_000;
    expect(manager.isAvailable()).toBe(true);
    expect(await manager.showRewarded()).toEqual({ status: 'completed' });
  });

});
