/**
 * TapTap mini-game rewarded-video adapter.
 * The web build remains usable without TapTap APIs; missing platform or ad unit
 * never grants a reward. Reward is accepted only on onClose({ isEnded: true }).
 */
export function createTapTapRewardedAd({
  adUnitId = '',
  getPlatform = () => globalThis.tap,
  loadTimeoutMs = 15_000,
  playbackTimeoutMs = 120_000,
  firstAdDelayMs = 60_000,
  now = () => globalThis.performance?.now?.() ?? Date.now(),
} = {}) {
  const createdAt = now();
  let ad = null;
  let loaded = false;
  let inFlight = false;
  let loadPromise = null;
  let loadResolve = null;
  let loadReject = null;
  let active = null;

  const errorMessage = (error) => {
    if (typeof error === 'string') return error;
    return error && typeof error.message === 'string' ? error.message : 'TapTap ad error';
  };

  function isConfigured() {
    const platform = getPlatform();
    return Boolean(String(adUnitId || '').trim())
      && Boolean(platform && typeof platform.createRewardedVideoAd === 'function');
  }

  function isAvailable() {
    return isConfigured() && now() - createdAt >= firstAdDelayMs;
  }

  function settle(outcome) {
    if (!active) return;
    const current = active;
    active = null;
    clearTimeout(current.timer);
    current.resolve(outcome);
  }

  function ensureAd() {
    if (ad) return ad;
    const platform = getPlatform();
    if (!platform || typeof platform.createRewardedVideoAd !== 'function') {
      throw new Error('TapTap rewarded video API is unavailable');
    }

    ad = platform.createRewardedVideoAd({ adUnitId: String(adUnitId).trim() });
    if (!ad || typeof ad.show !== 'function') {
      ad = null;
      throw new Error('TapTap rewarded video API returned an invalid ad object');
    }

    ad.onLoad?.(() => {
      loaded = true;
      if (loadResolve) loadResolve();
    });
    ad.onError?.((error) => {
      loaded = false;
      if (loadReject) {
        loadReject(new Error(errorMessage(error)));
      } else {
        settle({ status: 'error', reason: 'sdk-error', message: errorMessage(error) });
      }
    });
    ad.onClose?.((result) => {
      loaded = false;
      settle(result && result.isEnded === true
        ? { status: 'completed' }
        : { status: 'cancelled' });
    });
    return ad;
  }

  function waitForLoad(instance) {
    if (loaded) return Promise.resolve();
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      let done = false;
      const finish = (fn, value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        loadResolve = null;
        loadReject = null;
        loadPromise = null;
        fn(value);
      };
      const timer = setTimeout(() => finish(reject, new Error('TapTap ad loading timed out')), loadTimeoutMs);
      loadResolve = () => finish(resolve);
      loadReject = (error) => finish(reject, error);

      if (typeof instance.load === 'function') {
        Promise.resolve()
          .then(() => instance.load())
          .then(() => {
            // Some SDKs resolve load() without emitting onLoad; the resolved
            // promise still means a creative is available to display.
            loaded = true;
            if (loadResolve) loadResolve();
          })
          .catch((error) => {
            if (loadReject) loadReject(error);
          });
      }
      // If load() does not exist, wait for the SDK's onLoad event.
    });
    return loadPromise;
  }

  async function showRewarded() {
    if (!String(adUnitId || '').trim()) return { status: 'unavailable', reason: 'missing-ad-unit-id' };
    if (inFlight) return { status: 'busy' };
    if (!isConfigured()) return { status: 'unavailable', reason: 'platform-api-unavailable' };
    // TapTap first-launch policy: do not show ads during the first 60 seconds.
    // Use a monotonic page-session clock by default; the host must still confirm
    // any additional level/session restrictions for the final publication channel.
    if (now() - createdAt < firstAdDelayMs) {
      return { status: 'unavailable', reason: 'startup-delay' };
    }

    inFlight = true;
    try {
      const instance = ensureAd();
      try {
        await waitForLoad(instance);
      } catch (error) {
        return { status: 'error', reason: 'load-failed', message: errorMessage(error) };
      }

      return await new Promise((resolve) => {
        const timer = setTimeout(() => {
          loaded = false;
          settle({ status: 'timeout', reason: 'no-close-callback' });
        }, playbackTimeoutMs);
        active = { resolve, timer };

        try {
          Promise.resolve(instance.show()).catch((error) => {
            settle({ status: 'error', reason: 'show-failed', message: errorMessage(error) });
          });
        } catch (error) {
          settle({ status: 'error', reason: 'show-failed', message: errorMessage(error) });
        }
      });
    } catch (error) {
      return { status: 'error', reason: 'adapter-error', message: errorMessage(error) };
    } finally {
      inFlight = false;
      active = null;
    }
  }

  return { isConfigured, isAvailable, showRewarded };
}
