import { afterEach, describe, expect, it } from 'vitest';
import Jimp from 'jimp';
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

describe('Jimp asset pipeline compatibility', () => {
  it('can read, crop, resize, composite to a transparent canvas and write PNG', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'bsz-jimp-smoke-'));
    const inputPath = join(tempDir, 'input.png');
    const outputPath = join(tempDir, 'output.png');

    const source = await new Promise((resolve, reject) => {
      new Jimp(4, 3, 0xff00ffff, (error, image) => {
        if (error) reject(error);
        else resolve(image);
      });
    });
    await source.writeAsync(inputPath);

    const read = await Jimp.read(inputPath);
    const cropped = read.clone().crop(1, 0, 2, 3).resize(4, 6);
    const canvas = new Jimp(8, 8, 0x00000000);
    canvas.composite(cropped, 2, 1);
    await canvas.writeAsync(outputPath);

    const result = await Jimp.read(outputPath);
    expect(result.bitmap.width).toBe(8);
    expect(result.bitmap.height).toBe(8);
    expect(result.bitmap.data[(2 * 8 + 3) * 4 + 3]).toBeGreaterThan(0);
    expect(result.bitmap.data[3]).toBe(0);
  });
});
