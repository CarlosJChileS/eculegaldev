import { describe, expect, it } from 'vitest';
import { LegalCatalog } from '../src/catalog.js';
describe('LegalCatalog', () => {
  it('loads and searches verified sources', async () => { const c = await LegalCatalog.load(); const results = c.search('datos personales'); expect(results.length).toBeGreaterThan(0); expect(results[0].url.startsWith('https://')).toBe(true); });
  it('covers the fundamental developer-relevant legal domains', async () => {
    const titles = new Set((await LegalCatalog.load()).all().map((source) => source.title));
    expect([...titles].some((title) => title.includes('Constitución'))).toBe(true);
    expect([...titles].some((title) => title.includes('Código del Trabajo'))).toBe(true);
    expect([...titles].some((title) => title.includes('Código Tributario'))).toBe(true);
    expect([...titles].some((title) => title.includes('Ley de Compañías'))).toBe(true);
    expect([...titles].some((title) => title.includes('sector financiero'))).toBe(true);
    expect([...titles].some((title) => title.includes('sector salud'))).toBe(true);
    expect([...titles].some((title) => title.includes('sector educativo'))).toBe(true);
  });
  it('requires actionable metadata for enriched legal groups', async () => {
    const ids = ['comercio-electronico', 'propiedad-intelectual', 'telecomunicaciones', 'coip-delitos-informaticos', 'codigo-trabajo', 'ley-companias', 'fintech', 'marco-sector-financiero', 'marco-sector-salud', 'marco-sector-educativo', 'facturacion-electronica-sri', 'defensa-consumidor'];
    const sources = await LegalCatalog.load();
    for (const id of ids) {
      const source = sources.get(id);
      expect(source?.obligations?.length, id).toBeGreaterThan(0);
      for (const obligation of source?.obligations ?? []) {
        expect(obligation.article.length).toBeGreaterThan(0);
        expect(obligation.sourceUrl.startsWith('https://')).toBe(true);
        expect(obligation.evidence.length).toBeGreaterThan(0);
        expect(obligation.documentaryReviewedAt).toMatch(/^2026-/);
      }
    }
  });
  it('covers the specialized technology catalog scope', async () => {
    const sources = await LegalCatalog.load();
    const topics = new Set(sources.all().flatMap(source => source.topics));
    for (const topic of ['comercio electrónico', 'datos personales', 'facturación electrónica', 'proveedores', 'fintech', 'telecomunicaciones', 'sector salud', 'educación superior', 'contratos', 'seguridad']) expect(topics.has(topic), topic).toBe(true);
  });
  it('classifies every source in the normative hierarchy and includes effective Budapest Convention', async () => {
    const sources = (await LegalCatalog.load()).all();
    expect(sources.every(source => source.hierarchyLevel)).toBe(true);
    expect(sources.find(source => source.id === 'constitucion-republica')?.hierarchyLevel).toBe('constitucion');
    const budapest = sources.find(source => source.id === 'convenio-budapest-ciberdelincuencia');
    expect(budapest).toMatchObject({ hierarchyLevel: 'tratado_internacional', status: 'vigente', publishedAt: '2025-04-04' });
    expect(budapest?.history?.some(event => event.date === '2025-03-12')).toBe(true);
    expect(budapest?.verification).toMatchObject({ statusBasis: 'documental_oficial', documentaryStatus: 'revisado' });
    expect(budapest?.verification?.legalReviewedAt).toBeUndefined();
    expect(sources.find(source => source.id === 'lopdp')?.hierarchyLevel).toBe('ley_organica');
    expect(sources.find(source => source.id === 'ley-fortalecimiento-ciberseguridad')?.hierarchyLevel).toBe('ley_organica');
    expect(sources.find(source => source.id === 'ley-fortalecimiento-ciberseguridad')?.obligations?.map(item => item.id)).toEqual(expect.arrayContaining(['prestador-digital-responsabilidad-compartida', 'alcance-critico-esencial', 'notificacion-vulneracion-lopdp']));
    expect(sources.find(source => source.id === 'nte-inen-iso-iec-22989-2022')?.hierarchyLevel).toBe('estandar_tecnico');
    expect(sources.find(source => source.id === 'ley-organica-inteligencia-2025')?.history?.some(event => event.type === 'reglamento')).toBe(true);
    expect(sources.find(source => source.id === 'reforma-telecomunicaciones-2025')?.relatedSourceIds).toContain('telecomunicaciones');
    expect(sources.find(source => source.id === 'ley-vigilancia-seguridad-privada-2024')?.obligations?.[0].appliesWhenRules).toContain('providesPrivateSecurity');
    expect(sources.find(source => source.id === 'spdp-gran-escala-2026')?.hierarchyLevel).toBe('resolucion');
    expect(sources.find(source => source.id === 'spdp-ia-2026')?.history?.some(event => event.date === '2026-09-21')).toBe(true);
    expect(sources.find(source => source.id === 'spdp-biometria-2026')).toMatchObject({ publishedAt: null, status: 'pendiente_verificacion' });
    expect(sources.find(source => source.id === 'spdp-vulneraciones-2026')).toMatchObject({ publishedAt: null, status: 'pendiente_verificacion' });
    const coverage = await import('../src/coverage.js').then(({ createCoverageReport }) => createCoverageReport());
    expect(coverage.legalReviews).toBe(0);
    expect(coverage.documentaryReviews).toBeGreaterThan(0);
  });
});
