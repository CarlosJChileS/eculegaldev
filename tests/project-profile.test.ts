import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inferProjectProfile } from '../src/project-profile.js';

const roots: string[] = [];
async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'eculegal-profile-'));
  roots.push(root);
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    const { mkdir } = await import('node:fs/promises');
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, content);
  }
  return root;
}
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe('inferProjectProfile', () => {
  it('classifies e-commerce and payment signals without claiming cross-border transfers', async () => {
    const root = await fixture({ 'package.json': '{"dependencies":{"stripe":"^1.0.0","supabase":"^1.0.0"}}', 'README.md': 'Tienda online para vender productos con checkout.' });
    const profile = await inferProjectProfile(root);
    expect(profile.projectTypes.map(item => item.id)).toContain('ecommerce');
    expect(profile.suggestions.handlesPayments).toBe(true);
    expect(profile.suggestions.usesProviders).toBe(true);
    expect(profile.suggestions.internationalTransfers).toBe(false);
    expect(profile.questions.some(question => question.includes('desde qué países'))).toBe(true);
  });

  it('classifies health and education sectors and explains evidence', async () => {
    const root = await fixture({ 'README.md': 'Aplicación de telemedicina para estudiantes de escuela, con historias clínicas.' });
    const profile = await inferProjectProfile(root);
    expect(profile.projectTypes.map(item => item.id)).toEqual(expect.arrayContaining(['salud', 'educativo']));
    expect(profile.suggestions.storesSensitiveData).toBe(true);
    expect(profile.suggestions.hasMinors).toBe(true);
    expect(profile.signals.every(signal => signal.evidence.length > 0)).toBe(true);
  });
  it('detects telecom, private security and public sector as distinct candidates', async () => {
    const root = await fixture({ 'README.md': 'Plataforma para entidad pública, operador de telecomunicaciones y central de monitoreo de seguridad privada.' });
    const profile = await inferProjectProfile(root);
    expect(profile.projectTypes.map(item => item.id)).toEqual(expect.arrayContaining(['telecomunicaciones', 'seguridad_privada', 'sector_publico']));
  });
  it('detects biometrics and incident signals without asserting legal applicability', async () => {
    const root = await fixture({ 'README.md': 'Sistema de reconocimiento facial y huella biométrica, procesa datos a gran escala. Simular una brecha de seguridad.' });
    const profile = await inferProjectProfile(root);
    expect(profile.projectTypes.map(item => item.id)).toContain('biometria');
    expect(profile.suggestions).toMatchObject({ usesBiometrics: true, largeScaleProcessing: true, hasSecurityIncident: true });
    expect(profile.disclaimer).toContain('no confirma actividades reales');
  });
  it('detects digital service and criticality language as hypotheses with questions', async () => {
    const root = await fixture({ 'README.md': 'Plataforma digital para infraestructura crítica y continuidad de servicios esenciales.' });
    const profile = await inferProjectProfile(root);
    expect(profile.projectTypes.map(item => item.id)).toContain('ciberseguridad');
    expect(profile.suggestions).toMatchObject({ providesDigitalService: true, operatesCriticalEssentialService: true });
    expect(profile.questions.some(question => question.includes('clasificación formal'))).toBe(true);
  });
});
