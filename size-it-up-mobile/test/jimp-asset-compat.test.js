import { afterEach, describe, expect, it } from 'vitest';
import { Jimp } from 'jimp';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let tempDir;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

// Keep this smoke test aligned with Jimp 1.x APIs used by build-assets.mjs.
describe('Jimp 1.x asset pipeline compatibility', () => {
  it('can read, crop, resize, composite to a transparent canvas and write PNG', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'bsz-jimp-smoke-'));
    const inputPath = join(tempDir, 'input.png');
    const outputPath = join(tempDir, 'output.png');

    const source = new Jimp({ width: 4, height: 3, color: 0xff00ffff });
    await source.write(inputPath);

    const read = await Jimp.read(inputPath);
    const cropped = read.clone().crop({ x: 1, y: 0, w: 2, h: 3 }).resize({ w: 4, h: 6 });
    const canvas = new Jimp({ width: 8, height: 8, color: 0x00000000 });
    canvas.composite(cropped, 2, 1);
    await canvas.write(outputPath);

    const result = await Jimp.read(outputPath);
    expect(result.bitmap.width).toBe(8);
    expect(result.bitmap.height).toBe(8);
    expect(result.bitmap.data[(2 * 8 + 3) * 4 + 3]).toBeGreaterThan(0);
    expect(result.bitmap.data[3]).toBe(0);
  });
});
