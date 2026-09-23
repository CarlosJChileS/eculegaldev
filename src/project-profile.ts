import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

export type InferredProjectProfile = {
  projectTypes: Array<{ id: string; label: string; confidence: 'alta' | 'media' | 'baja'; evidence: string[] }>;
  signals: Array<{ key: string; detected: boolean; evidence: string[]; confidence: 'alta' | 'media' | 'baja' }>;
  suggestions: { processesPersonalData: boolean; usesProviders: boolean; sellsOnline: boolean; storesSensitiveData: boolean; handlesPayments: boolean; issuesInvoices: boolean; internationalTransfers: boolean; hasEmployees: boolean; hasMinors: boolean; usesAi: boolean; usesBiometrics: boolean; largeScaleProcessing: boolean; hasSecurityIncident: boolean; providesDigitalService: boolean; operatesCriticalEssentialService: boolean; sectors: string[] };
  questions: string[];
  disclaimer: string;
};

const excluded = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.mcp-governance']);
const maxFiles = 500;
const maxFileBytes = 96_000;
async function collect(root: string, dir = root, depth = 0, files: string[] = []): Promise<string[]> {
  if (depth > 5 || files.length >= maxFiles) return files;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (files.length >= maxFiles) break;
    if (excluded.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(root, path, depth + 1, files);
    else if (/^(package\.json|Cargo\.toml|go\.mod|pom\.xml|pyproject\.toml|requirements\.txt|Gemfile|composer\.json|README(?:\.[^.]*)?|.*\.(?:md|ya?ml|json|toml|py|tsx?|jsx?|java|cs|go))$/i.test(entry.name)) files.push(path);
  }
  return files;
}
async function readBounded(path: string) {
  try { return (await readFile(path)).subarray(0, maxFileBytes).toString('utf8'); }
  catch { return ''; }
}

export async function inferProjectProfile(root: string): Promise<InferredProjectProfile> {
  const paths = await collect(root);
  const contents = await Promise.all(paths.map(async path => [relative(root, path).replaceAll('\\', '/'), await readBounded(path)] as const));
  const combined = contents.map(([path, body]) => `${path}\n${body}`).join('\n').toLowerCase();
  const evidence: Record<string, string[]> = {};
  const add = (key: string, why: string) => (evidence[key] ??= []).push(why);
  const has = (pattern: RegExp) => pattern.test(combined);
  if (has(/\b(stripe|paypal|mercadopago|payment|checkout|pago|pasarela)\b/)) add('handlesPayments', 'SDK, dependencia o referencia a pago/checkout');
  if (has(/\b(invoice|factura|sri|ruc|comprobante electr[oó]nico)\b/)) add('issuesInvoices', 'Referencia a facturación o comprobantes');
  if (has(/\b(supabase|firebase|aws|azure|gcp|cloudflare|sendgrid|twilio)\b/)) add('usesProviders', 'Proveedor cloud o servicio externo referenciado');
  if (has(/\b(auth|login|user|usuario|email|correo|profile|perfil|personal.?data|datos.?personales|customer|cliente)\b/)) add('processesPersonalData', 'Identidad, cuentas o datos de clientes referenciados');
  if (/health|medical|salud|cl[ií]nic|historia.?cl[ií]nica|biometric|biometr|sensitive|sensible/.test(combined)) add('storesSensitiveData', 'Salud, biometría o categorías sensibles referenciadas');
  if (/biometric|biometr[ií]a|huella dactilar|reconocimiento facial|iris|patr[oó]n de voz/.test(combined)) add('usesBiometrics', 'Uso de rasgos biométricos referido en archivos del proyecto');
  if (/gran escala|large.?scale|millones de usuarios|millions of users|datos masivos/.test(combined)) add('largeScaleProcessing', 'Volumen o tratamiento a gran escala referido; requiere evaluación por actividad');
  if (/brecha de seguridad|vulneraci[oó]n de datos|data breach|security incident|notificaci[oó]n de incidentes/.test(combined)) add('hasSecurityIncident', 'Incidente o vulneración referido; comprobar si es un evento real y su riesgo');
  if (/prestador de servicios digitales|digital service provider|servicios digitales|plataforma digital/.test(combined)) add('providesDigitalService', 'Prestación de servicios digitales referida; confirmar alcance contractual y esfera de control');
  if (/infraestructura cr[ií]tica|servicio esencial|critical infrastructure|essential service/.test(combined)) add('operatesCriticalEssentialService', 'Criticidad o servicio esencial referido; confirmar clasificación/regulación oficial');
  if (/minor|menor|child|niñ[oa]|school|escuela|student|estudiante|academic/.test(combined)) add('hasMinors', 'Menores, estudiantes o servicio educativo referenciados');
  if (has(/\b(shop|store|tienda|ecommerce|e-commerce|venta|product|producto|order|pedido|cart|carrito)\b/)) add('sellsOnline', 'Catálogo, venta o pedidos referenciados');
  if (has(/\b(openai|anthropic|llm|machine learning|\bai\b|inteligencia artificial|modelo generativo)\b/)) add('usesAi', 'Dependencia o descripción menciona IA/ML');

  const types: Record<string, { label: string; keys: string[]; pattern?: RegExp }> = {
    ecommerce: { label: 'Comercio electrónico', keys: ['sellsOnline'] },
    fintech: { label: 'Fintech o servicios financieros', keys: ['handlesPayments'], pattern: /\b(fintech|wallet|billetera|cr[eé]dito|pr[eé]stamo|banking|banca|exchange|criptoactivo)\b/ },
    salud: { label: 'Salud o tecnología sanitaria', keys: ['storesSensitiveData'], pattern: /health|medical|salud|cl[ií]nic|telemedicina|historia.?cl[ií]nica/ },
    educativo: { label: 'Educación o plataforma educativa', keys: ['hasMinors'], pattern: /\b(school|escuela|student|estudiante|educaci[oó]n|academic|campus|lms)\b/ },
    saas: { label: 'SaaS o plataforma digital', keys: ['usesProviders', 'processesPersonalData'], pattern: /\b(saas|multi.?tenant|subscription|suscripci[oó]n|dashboard|workspace)\b/ },
    ia: { label: 'Producto con inteligencia artificial', keys: ['usesAi'] },
    biometria: { label: 'Sistema que trata biometría', keys: ['usesBiometrics'] },
    telecomunicaciones: { label: 'Telecomunicaciones', keys: [], pattern: /telecomunicaciones|operador de red|proveedor de internet|isp\b|arcotel/ },
    seguridad_privada: { label: 'Seguridad privada', keys: [], pattern: /seguridad privada|guardias de seguridad|monitoreo de alarmas|central de monitoreo/ },
    sector_publico: { label: 'Sector público', keys: [], pattern: /entidad p[uú]blica|gobierno|municipio|ministerio|servicio p[uú]blico/ },
    datos_personales: { label: 'Sistema que trata datos personales', keys: ['processesPersonalData'] },
    ciberseguridad: { label: 'Prestador de servicios digitales o infraestructura crítica', keys: ['providesDigitalService', 'operatesCriticalEssentialService'] },
  };
  const projectTypes = Object.entries(types).flatMap(([id, config]) => {
    const matched = config.keys.some(key => evidence[key]?.length) || Boolean(config.pattern?.test(combined));
    if (!matched) return [];
    const matchedEvidence = [...new Set([...config.keys.flatMap(key => evidence[key] ?? []), ...(config.pattern?.test(combined) ? ['Descripción o código contiene términos del sector'] : [])])];
    return [{ id, label: config.label, confidence: matchedEvidence.length > 1 ? 'alta' as const : 'media' as const, evidence: matchedEvidence }];
  });
  const signals = Object.entries(evidence).map(([key, items]) => ({ key, detected: true, evidence: [...new Set(items)], confidence: items.length > 1 ? 'alta' as const : 'media' as const }));
  const suggestions = {
    processesPersonalData: Boolean(evidence.processesPersonalData || evidence.storesSensitiveData || evidence.hasMinors),
    usesProviders: Boolean(evidence.usesProviders), sellsOnline: Boolean(evidence.sellsOnline),
    storesSensitiveData: Boolean(evidence.storesSensitiveData), handlesPayments: Boolean(evidence.handlesPayments),
    issuesInvoices: Boolean(evidence.issuesInvoices), internationalTransfers: false, hasEmployees: false,
    hasMinors: Boolean(evidence.hasMinors), usesAi: Boolean(evidence.usesAi), usesBiometrics: Boolean(evidence.usesBiometrics), largeScaleProcessing: Boolean(evidence.largeScaleProcessing), hasSecurityIncident: Boolean(evidence.hasSecurityIncident), providesDigitalService: Boolean(evidence.providesDigitalService), operatesCriticalEssentialService: Boolean(evidence.operatesCriticalEssentialService),
    sectors: projectTypes.filter(item => ['fintech', 'salud', 'educativo', 'telecomunicaciones', 'seguridad_privada', 'sector_publico'].includes(item.id)).map(item => item.id),
  };
  const questions = [
    !evidence.processesPersonalData && !evidence.storesSensitiveData ? '¿El servicio recopila o accede a datos de usuarios, clientes o trabajadores?' : undefined,
    evidence.usesProviders ? '¿Qué proveedores acceden a datos y desde qué países? Un proveedor no prueba por sí solo una transferencia internacional.' : undefined,
    evidence.handlesPayments ? '¿El proyecto solo integra una pasarela o presta un servicio financiero regulado?' : undefined,
    evidence.sellsOnline ? '¿Quién vende al consumidor: el titular de la plataforma o terceros?' : undefined,
    evidence.hasMinors ? '¿El servicio está dirigido a menores y qué datos recoge de ellos?' : undefined,
    evidence.providesDigitalService ? '¿Qué componentes del servicio digital están bajo control del operador y cuáles de proveedores/cliente?' : undefined,
    evidence.operatesCriticalEssentialService ? '¿Existe clasificación formal como infraestructura crítica/servicio esencial y bajo qué sector regulado?' : undefined,
  ].filter((question): question is string => Boolean(question));
  return { projectTypes, signals, suggestions, questions, disclaimer: 'Perfil técnico inferido de archivos y dependencias visibles; es una hipótesis, no confirma actividades reales, jurisdicción, sujetos obligados ni aplicabilidad legal. Confirme las señales antes de usar el análisis.' };
}
