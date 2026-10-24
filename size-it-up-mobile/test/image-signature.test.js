import { describe, expect, it } from 'vitest';
import { hasSupportedRasterSignature } from '../tools/image-signature.mjs';

describe('asset image signature allowlist', () => {
  it('accepts PNG and JPEG magic bytes', () => {
    expect(hasSupportedRasterSignature(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))).toBe(true);
    expect(hasSupportedRasterSignature(Buffer.from([0xff,0xd8,0xff,0xe0]))).toBe(true);
  });

  it('rejects ASF and arbitrary bytes before Jimp format detection', () => {
    expect(hasSupportedRasterSignature(Buffer.from('3026b2758e66cf11a6d900aa0062ce6c', 'hex'))).toBe(false);
    expect(hasSupportedRasterSignature(Buffer.from('not an image'))).toBe(false);
    expect(hasSupportedRasterSignature(Buffer.alloc(0))).toBe(false);
  });
});
