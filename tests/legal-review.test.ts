import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateLegalReview } from '../src/legal-review.js';

const tempRoots: string[] = [];
afterEach(async () => { vi.unstubAllGlobals(); await Promise.all(tempRoots.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

describe('legal review automation', () => {
  it('never treats a Codex-assisted documentary check as a human legal review', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => new Response('<html>Fuente consultada</html>', { status: 200, headers: { 'content-type': 'text/html' } })));
    const root = await mkdtemp(join(tmpdir(), 'ecu-legal-review-'));
    tempRoots.push(root);
    const output = join(root, 'report.json');
    await generateLegalReview(undefined, output);
    const report = JSON.parse(await readFile(output, 'utf8'));
    const budapest = report.sources.find((source: any) => source.id === 'convenio-budapest-ciberdelincuencia');
    expect(budapest).toMatchObject({ recommendedStatus: 'pendiente_verificacion', conclusion: 'requiere_revision_juridica' });
  });
});
