import { describe, expect, it } from 'vitest';
import { LegalCatalog } from '../src/catalog.js';
import { assessProject } from '../src/compliance.js';
describe('assessProject', () => {
  it('returns risks, controls and disclaimer for a data project', async () => { const c = await LegalCatalog.load(); const result = assessProject({ name: 'Portal escolar', processesPersonalData: true, usesProviders: true }, c.all()); expect(result.risks.length).toBeGreaterThan(0); expect(result.controls.length).toBeGreaterThan(0); expect(result.disclaimer).toContain('no constituye'); });
  it('explains which profile signals surfaced each obligation and what evidence closes its gap', async () => {
    const catalog = await LegalCatalog.load();
    const result = assessProject({ name: 'Portal escolar', processesPersonalData: true, usesProviders: true }, catalog.all());
    const obligation = result.obligations.find(item => item.normId === 'lopdp');
    expect(obligation?.applicabilityReason).toContain('tratamiento de datos personales declarado');
    expect(obligation?.missingInformation).toContain('Confirmar si hay almacenamiento o acceso desde otros países.');
    expect(obligation?.closureCriterion).toContain('revisión');
  });
  it('returns sector-specific and conditional references for the declared project profile', async () => {
    const catalog = await LegalCatalog.load();
    const result = assessProject({ name: 'Plataforma clínica', processesPersonalData: true, storesSensitiveData: true, sectors: ['salud'], hasEmployees: false }, catalog.all());
    expect(result.projectTypes).toContain('salud');
    expect(result.applicableReferences.some(item => item.id === 'marco-sector-salud')).toBe(true);
    expect(result.applicableReferences.some(item => item.id === 'codigo-trabajo')).toBe(false);
    expect(result.conditionalReferences).toBeDefined();
  });
  it('keeps business-entity and telecom duties conditional until the operator facts are declared', async () => {
    const catalog = await LegalCatalog.load();
    const unknown = assessProject({ name: 'Plataforma' }, catalog.all());
    expect(unknown.obligations.find(item => item.normId === 'ley-companias')?.applicabilityStatus).toBe('condicional');
    const person = assessProject({ name: 'Servicio personal', organizationType: 'persona_natural', isCompany: false, operatesTelecomNetwork: false }, catalog.all());
    expect(person.obligations.some(item => item.normId === 'ley-companias')).toBe(false);
    expect(person.obligations.some(item => item.normId === 'reforma-telecomunicaciones-2025')).toBe(false);
  });
  it('selects large-scale, AI, biometric and breach rules only when the matching facts are stated', async () => {
    const catalog = await LegalCatalog.load();
    const none = assessProject({ name: 'SaaS', processesPersonalData: true, usesAi: false, usesBiometrics: false, largeScaleProcessing: false, hasSecurityIncident: false }, catalog.all());
    expect(none.obligations.some(item => ['spdp-gran-escala-2026', 'spdp-biometria-2026', 'spdp-vulneraciones-2026'].includes(item.normId))).toBe(false);
    const unknownAi = assessProject({ name: 'SaaS', processesPersonalData: true }, catalog.all());
    expect(unknownAi.obligations.find(item => item.normId === 'spdp-ia-2026')?.applicabilityStatus).toBe('condicional');
    expect(unknownAi.conditionalReferences.some(item => item.id === 'spdp-ia-2026')).toBe(true);
    const enabled = assessProject({ name: 'IA clínica', processesPersonalData: true, usesAi: true, usesBiometrics: true, largeScaleProcessing: true, hasSecurityIncident: true }, catalog.all());
    expect(enabled.obligations.some(item => item.normId === 'spdp-gran-escala-2026' && item.applicabilityStatus === 'aplicable')).toBe(true);
    expect(enabled.obligations.some(item => item.normId === 'spdp-ia-2026')).toBe(true);
    expect(enabled.obligations.some(item => item.normId === 'spdp-biometria-2026')).toBe(true);
    expect(enabled.obligations.some(item => item.normId === 'spdp-vulneraciones-2026')).toBe(true);
  });
  it('applies cybersecurity duties to digital providers, but keeps critical-infrastructure duties conditional', async () => {
    const catalog = await LegalCatalog.load();
    const provider = assessProject({ name: 'SaaS', providesDigitalService: true }, catalog.all());
    expect(provider.obligations.find(item => item.id.endsWith('prestador-digital-responsabilidad-compartida'))?.applicabilityStatus).toBe('aplicable');
    expect(provider.obligations.find(item => item.id.endsWith('alcance-critico-esencial'))?.applicabilityStatus).toBe('condicional');
    expect(provider.questions.some(question => question.includes('servicio esencial'))).toBe(true);
    const nonCritical = assessProject({ name: 'Comercio digital', providesDigitalService: true, operatesCriticalEssentialService: false }, catalog.all());
    expect(nonCritical.obligations.some(item => item.id.endsWith('alcance-critico-esencial'))).toBe(false);
    const breach = assessProject({ name: 'Proyecto', hasSecurityIncident: true }, catalog.all());
    expect(breach.obligations.find(item => item.id.endsWith('notificacion-vulneracion-lopdp'))?.applicabilityStatus).toBe('condicional');
  });
});
