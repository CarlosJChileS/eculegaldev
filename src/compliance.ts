import type { LegalSource } from './domain.js';
import { type Language, localized } from './i18n.js';
export type ProjectProfile = { name: string; processesPersonalData?: boolean; usesProviders?: boolean; sellsOnline?: boolean; storesSensitiveData?: boolean; handlesPayments?: boolean; issuesInvoices?: boolean; internationalTransfers?: boolean; hasEmployees?: boolean; hasMinors?: boolean; usesAi?: boolean; sectors?: string[]; organizationType?: 'persona_natural' | 'sociedad' | 'entidad_publica' | 'sin_definir'; offersRegulatedFinancialService?: boolean; isCompany?: boolean; operatesTelecomNetwork?: boolean; providesPrivateSecurity?: boolean; processesPublicSectorData?: boolean; largeScaleProcessing?: boolean; usesBiometrics?: boolean; hasSecurityIncident?: boolean; providesDigitalService?: boolean; operatesCriticalEssentialService?: boolean };
export type ComplianceStatus = 'pendiente' | 'en_progreso' | 'cumple' | 'no_cumple' | 'no_aplica' | 'aceptada_temporalmente' | 'requiere_revision_legal';
export type CompliancePriority = 'critica' | 'alta' | 'media' | 'baja';
const scoreDimensions = ['cumplimiento_legal', 'seguridad_tecnica', 'privacidad', 'gobierno_datos', 'tributacion', 'comercio_electronico', 'gestion_documental'] as const;
type ScoreDimension = typeof scoreDimensions[number];
export function assessProject(project: ProjectProfile, sources: LegalSource[], language: Language = 'es') {
  const risks: string[] = [], controls: string[] = [], questions: string[] = [];
  if (project.processesPersonalData) { risks.push(localized(language, 'El proyecto trata datos personales y requiere identificar base jurídica, transparencia y medidas de seguridad.', 'The project processes personal data and requires a legal basis, transparency, and security measures.')); controls.push(localized(language, 'Inventariar tratamientos, finalidades, responsables, encargados y plazos de conservación.', 'Inventory processing activities, purposes, controllers, processors, and retention periods.')); }
  if (project.storesSensitiveData) { risks.push(localized(language, 'El tratamiento de datos sensibles requiere controles reforzados y revisión especializada.', 'Processing sensitive data requires enhanced controls and specialist review.')); controls.push(localized(language, 'Aplicar minimización, control de acceso, cifrado y evaluación de impacto cuando corresponda.', 'Apply minimization, access control, encryption, and an impact assessment where applicable.')); }
  if (project.usesProviders) { risks.push(localized(language, 'Los proveedores que acceden a datos deben tener responsabilidades y garantías documentadas.', 'Providers accessing data must have documented responsibilities and safeguards.')); controls.push(localized(language, 'Formalizar contratos, instrucciones, subencargados, confidencialidad y gestión de incidentes.', 'Formalize contracts, instructions, subprocessors, confidentiality, and incident management.')); }
  if (project.sellsOnline) { risks.push(localized(language, 'La venta digital requiere revisar información al consumidor, contratación y comprobantes aplicables.', 'Digital sales require reviewing consumer information, contracting, and applicable receipts.')); controls.push(localized(language, 'Documentar términos, privacidad, devoluciones, soporte y evidencia de consentimiento.', 'Document terms, privacy, returns, support, and consent evidence.')); }
  if (project.handlesPayments || project.issuesInvoices) { risks.push(localized(language, 'Los pagos o comprobantes requieren revisar obligaciones tributarias, seguridad y conservación documental según el modelo real.', 'Payments or invoices require reviewing tax, security, and document-retention obligations for the actual model.')); controls.push(localized(language, 'Definir proveedor, trazabilidad, controles antifraude y conservación de comprobantes.', 'Define provider, traceability, anti-fraud controls, and invoice retention.')); }
  if (!project.processesPersonalData && project.processesPersonalData !== false) questions.push(localized(language, '¿El sistema recolecta, consulta, almacena o comparte datos de personas?', 'Does the system collect, access, store, or share personal data?'));
  if (project.usesProviders === undefined) questions.push(localized(language, '¿Qué proveedores tecnológicos acceden a los datos y desde qué países?', 'Which technology providers access data, and from which countries?'));
  if (project.internationalTransfers === undefined) questions.push(localized(language, '¿Se alojan o consultan datos desde fuera de Ecuador?', 'Are data hosted or accessed from outside Ecuador?'));
  if (project.sellsOnline === undefined) questions.push(localized(language, '¿El proyecto ofrece bienes o servicios en línea a consumidores?', 'Does the project offer goods or services online to consumers?'));
  if (project.organizationType === undefined) questions.push(localized(language, '¿Quién opera el proyecto: persona natural, sociedad o entidad pública?', 'Who operates the project: an individual, company, or public entity?'));
  if (project.hasEmployees === undefined) questions.push(localized(language, '¿El proyecto tiene trabajadores o contratistas en Ecuador?', 'Does the project have employees or contractors in Ecuador?'));
  if (project.providesDigitalService === true && project.operatesCriticalEssentialService === undefined) questions.push(localized(language, '¿El proyecto fue clasificado o incide directamente en la continuidad de un servicio esencial? Usar tecnología no basta.', 'Has the project been classified or does it directly affect essential-service continuity? Using technology alone is insufficient.'));
  if (!project.name?.trim()) throw new Error(localized(language, 'El proyecto requiere un nombre', 'The project requires a name'));
  if (risks.length === 0) questions.push(localized(language, '¿Qué datos, usuarios, proveedores y canales de comercialización intervienen?', 'Which data, users, providers, and sales channels are involved?'));
  const topics = new Set<string>();
  if (project.processesPersonalData || project.storesSensitiveData || project.usesProviders) { topics.add('datos personales'); topics.add('privacidad'); }
  if (project.sellsOnline) { topics.add('comercio electrónico'); topics.add('consumidores'); topics.add('facturación electrónica'); }
  if (project.hasEmployees) topics.add('empleados');
  if (project.sectors?.includes('salud') || project.storesSensitiveData) { topics.add('sector salud'); topics.add('datos sensibles'); topics.add('historias clínicas'); }
  if (project.sectors?.includes('educativo') || project.hasMinors) { topics.add('sector educativo'); topics.add('datos de estudiantes'); topics.add('plataformas educativas'); }
  if (project.sectors?.includes('fintech') || project.offersRegulatedFinancialService) { topics.add('sector financiero'); topics.add('servicios financieros'); topics.add('fintech'); }
  if (project.usesAi) topics.add('inteligencia artificial');
  if (project.largeScaleProcessing) topics.add('tratamiento a gran escala');
  if (project.usesBiometrics) { topics.add('biometría'); topics.add('datos sensibles'); topics.add('datos personales'); topics.add('privacidad'); }
  if (project.hasSecurityIncident) { topics.add('notificación de vulneraciones'); topics.add('seguridad'); topics.add('datos personales'); }
  if (project.providesDigitalService || project.operatesCriticalEssentialService) { topics.add('ciberseguridad'); topics.add('seguridad'); topics.add('servicios digitales'); }
  if (project.handlesPayments) topics.add('pagos electrónicos');
  if (project.sectors?.includes('telecomunicaciones') || project.operatesTelecomNetwork) topics.add('telecomunicaciones');
  if (project.sectors?.includes('seguridad_privada') || project.providesPrivateSecurity) topics.add('seguridad privada');
  if (project.sectors?.includes('sector_publico') || project.processesPublicSectorData) topics.add('sistemas públicos');
  const applicabilitySignals = [
    project.processesPersonalData || project.storesSensitiveData ? 'tratamiento de datos personales declarado' : undefined,
    project.storesSensitiveData ? 'categorías sensibles declaradas' : undefined,
    project.usesProviders ? 'uso de proveedores declarado' : undefined,
    project.sellsOnline ? 'venta en línea declarada' : undefined,
    project.handlesPayments ? 'procesamiento de pagos declarado' : undefined,
    project.issuesInvoices ? 'emisión de comprobantes declarada' : undefined,
    project.internationalTransfers ? 'transferencias internacionales declaradas' : undefined,
    project.hasEmployees ? 'existencia de personal declarada' : undefined,
    project.hasMinors ? 'tratamiento relacionado con menores declarado' : undefined,
    project.usesAi ? 'uso de inteligencia artificial declarado' : undefined,
    project.sectors?.length ? `sector declarado: ${project.sectors.join(', ')}` : undefined,
    project.offersRegulatedFinancialService ? 'servicio financiero regulado declarado' : undefined,
    project.largeScaleProcessing ? 'tratamiento a gran escala declarado' : undefined,
    project.usesBiometrics ? 'uso de biometría declarado' : undefined,
    project.hasSecurityIncident ? 'incidente de seguridad declarado' : undefined,
    project.organizationType ? `operador declarado: ${project.organizationType}` : undefined,
  ].filter((signal): signal is string => Boolean(signal));
  const relevant = sources.filter(source => source.topics.some(topic => topics.has(topic)) ||
    (source.id === 'ley-companias' && project.isCompany !== false) ||
    (source.id === 'codigo-trabajo' && project.hasEmployees !== false));
  const checkRule = (rule: string) => rule === 'isCompany' ? project.isCompany : project[rule as keyof ProjectProfile] as boolean | undefined;
  const candidateObligations = relevant.flatMap(source => (source.obligations ?? []).map(obligation => {
    const ruleValues = (obligation.appliesWhenRules ?? []).map(checkRule);
    const excludedByProfile = ruleValues.some(value => value === false);
    const applicabilityStatus = excludedByProfile ? 'no_aplica' as const : ruleValues.some(value => value === undefined) ? 'condicional' as const : 'aplicable' as const;
    return { source, obligation, applicabilityStatus };
  }).filter(item => item.applicabilityStatus !== 'no_aplica'));
  const obligations = candidateObligations.map(({ source, obligation, applicabilityStatus }) => ({
    id: `${source.id}:${obligation.id}`,
    normId: source.id,
    normTitle: source.title,
    article: obligation.article,
    requirement: obligation.requirement[language],
    whyItApplies: obligation.appliesWhen[language],
    applicabilityStatus,
    applicabilityReason: localized(language,
      `La norma cubre ${source.topics.filter(topic => topics.has(topic)).join(', ')}; señales del perfil: ${applicabilitySignals.filter(signal => source.topics.some(topic => topics.has(topic))).join('; ') || 'coincidencia temática, validar el supuesto'}.`,
      `The source covers ${source.topics.filter(topic => topics.has(topic)).join(', ')}; profile signals: ${applicabilitySignals.filter(signal => source.topics.some(topic => topics.has(topic))).join('; ') || 'topic match; validate the trigger'}.`),
    evidence: obligation.evidence.map(item => item[language]),
    sourceUrl: obligation.sourceUrl,
    status: 'pendiente' as ComplianceStatus,
    legalReviewRequired: source.status === 'pendiente_verificacion',
    priority: (source.topics.includes('datos personales') || source.topics.includes('privacidad') ? 'alta' : 'media') as CompliancePriority,
    risk: localized(language, 'Riesgo de tratamiento sin controles o evidencia suficiente.', 'Risk of processing without sufficient controls or evidence.'),
    owner: localized(language, 'Responsable del proyecto', 'Project owner'),
    dueDate: null,
    missingInformation: [
      project.processesPersonalData === undefined ? localized(language, 'Confirmar si se tratan datos personales.', 'Confirm whether personal data is processed.') : undefined,
      project.usesProviders === undefined ? localized(language, 'Confirmar si proveedores acceden a datos o sistemas.', 'Confirm whether providers access data or systems.') : undefined,
      project.internationalTransfers === undefined ? localized(language, 'Confirmar si hay almacenamiento o acceso desde otros países.', 'Confirm whether storage or access occurs from other countries.') : undefined,
      project.sellsOnline === undefined ? localized(language, 'Confirmar si existe oferta o contratación en línea.', 'Confirm whether online offers or contracting exist.') : undefined,
      project.handlesPayments === undefined ? localized(language, 'Confirmar si el proyecto procesa pagos.', 'Confirm whether the project processes payments.') : undefined,
      project.issuesInvoices === undefined ? localized(language, 'Confirmar si se emiten comprobantes.', 'Confirm whether receipts or invoices are issued.') : undefined,
      project.organizationType === undefined ? localized(language, 'Identificar quién opera legalmente el proyecto.', 'Identify the project’s legal operator.') : undefined,
      project.offersRegulatedFinancialService === undefined ? localized(language, 'Confirmar si ofrece un servicio financiero regulado, más allá de integrar pagos.', 'Confirm whether it offers a regulated financial service beyond payment integration.') : undefined,
      project.largeScaleProcessing === undefined && project.processesPersonalData ? localized(language, 'Determinar por cada tratamiento el umbral de gran escala con volumen, titulares, categorías, frecuencia, permanencia y geografía.', 'Assess large-scale thresholds per processing activity using volume, data subjects, categories, frequency, duration and geography.') : undefined,
      project.usesBiometrics === undefined && project.processesPersonalData ? localized(language, 'Confirmar si se usan rasgos biométricos para identificar o autenticar personas.', 'Confirm whether biometric traits are used to identify or authenticate people.') : undefined,
      project.hasSecurityIncident === undefined ? localized(language, 'Confirmar si ocurrió una vulneración de datos personales; los deberes de notificación dependen del incidente y riesgo.', 'Confirm whether a personal-data breach occurred; notification duties depend on the incident and risk.') : undefined,
      project.providesDigitalService === undefined ? localized(language, 'Confirmar si el proyecto presta un servicio digital y qué componentes están bajo su control.', 'Confirm whether the project provides a digital service and which components it controls.') : undefined,
      project.operatesCriticalEssentialService === undefined ? localized(language, 'Confirmar si el proyecto fue clasificado o incide directamente en la continuidad de un servicio esencial; usar tecnología no basta.', 'Confirm whether the project was classified or directly affects essential-service continuity; using technology alone is insufficient.') : undefined,
    ].filter((item): item is string => Boolean(item)),
    gap: localized(language, `No se ha registrado evidencia de cumplimiento para ${obligation.article}.`, `No compliance evidence is recorded for ${obligation.article}.`),
    closureCriterion: localized(language, 'Registrar la evidencia indicada y completar una revisión legal y técnica.', 'Record the indicated evidence and complete legal and technical review.'),
    consequence: obligation.consequence?.[language] ?? localized(language, 'No documentada en el catálogo; requiere validación profesional.', 'Not documented in the catalog; professional validation required.'),
    exposure: obligation.exposure ?? (source.topics.includes('datos personales') ? 'alta' : 'media'),
    sanctionType: obligation.sanctionType?.[language] ?? localized(language, 'No documentado en el catálogo.', 'Not documented in the catalog.'),
    authority: obligation.authority?.[language] ?? localized(language, 'Autoridad competente no documentada.', 'Competent authority not documented.'),
    preventiveActions: obligation.preventiveActions?.map(item => item[language]) ?? [localized(language, 'Documentar controles, responsables y evidencia antes de operar.', 'Document controls, owners and evidence before operating.')],
    recommendedActions: [localized(language, `Revisar ${obligation.article} y adaptar el control al tratamiento real.`, `Review ${obligation.article} and adapt the control to the actual processing.`), ...((obligation.evidence ?? []).map(item => localized(language, `Crear o adjuntar: ${item.es}`, `Create or attach: ${item.en}`))), localized(language, 'Asignar responsable, registrar evidencia y solicitar revisión profesional antes de marcar como cumplido.', 'Assign an owner, record evidence and request professional review before marking as compliant.')],
  }));
  const dimensionTopics: Record<ScoreDimension, string[]> = { cumplimiento_legal: ['datos personales', 'privacidad', 'comercio electrónico', 'consumidores', 'facturación electrónica'], seguridad_tecnica: ['seguridad'], privacidad: ['datos personales', 'privacidad'], gobierno_datos: ['datos personales', 'encargados', 'transferencias internacionales'], tributacion: ['facturación electrónica'], comercio_electronico: ['comercio electrónico', 'consumidores'], gestion_documental: ['privacidad', 'contratos', 'documentacion'] };
  const complianceScores = Object.fromEntries(scoreDimensions.map(dimension => {
    const applicable = obligations.filter(item => item.applicabilityStatus === 'aplicable' && dimensionTopics[dimension].some(topic => relevant.find(source => source.id === item.normId)?.topics.includes(topic)));
    const completed = applicable.filter(item => item.status === 'cumple').length;
    const readiness = applicable.length ? Math.round(applicable.reduce((total, item) => total + (item.status === 'cumple' ? 100 : item.legalReviewRequired ? 25 : 0), 0) / applicable.length) : null;
    return [dimension, { score: applicable.length ? Math.round((completed / applicable.length) * 100) : null, readinessScore: readiness, status: applicable.length ? 'evaluada' : 'no_evaluada', obligations: applicable.length, completed, pending: applicable.filter(item => item.status !== 'cumple' && item.status !== 'no_aplica').length, legalReviewRequired: applicable.some(item => item.legalReviewRequired) }];
  }));
  const improvementPlan = obligations.sort((a, b) => ({ critica: 0, alta: 1, media: 2, baja: 3 }[a.priority] - { critica: 0, alta: 1, media: 2, baja: 3 }[b.priority])).map(item => ({ id: item.id, priority: item.priority, action: item.recommendedActions[0], steps: item.recommendedActions.slice(1), owner: item.owner, evidence: item.evidence, closureCriterion: item.closureCriterion, status: item.status }));
  const inferredProjectTypes = [
    project.sellsOnline ? 'comercio_electronico' : undefined,
    project.sectors?.includes('fintech') ? 'fintech' : undefined,
    project.sectors?.includes('salud') ? 'salud' : undefined,
    project.sectors?.includes('educativo') || project.hasMinors ? 'educativo' : undefined,
    project.usesAi ? 'inteligencia_artificial' : undefined,
    project.providesDigitalService ? 'servicio_digital' : undefined,
    project.operatesCriticalEssentialService ? 'servicio_esencial_o_infraestructura_critica' : undefined,
    project.processesPersonalData ? 'tratamiento_datos_personales' : undefined,
  ].filter((value): value is string => Boolean(value));
  const applicableIds = new Set(obligations.filter(item => item.applicabilityStatus === 'aplicable').map(item => item.normId));
  const conditionalIds = new Set(obligations.filter(item => item.applicabilityStatus === 'condicional').map(item => item.normId));
  return { project: project.name, language, projectTypes: inferredProjectTypes, profileCompleteness: Object.entries({ processesPersonalData: project.processesPersonalData, usesProviders: project.usesProviders, sellsOnline: project.sellsOnline, internationalTransfers: project.internationalTransfers, hasEmployees: project.hasEmployees, organizationType: project.organizationType, providesDigitalService: project.providesDigitalService, operatesCriticalEssentialService: project.operatesCriticalEssentialService }).filter(([, value]) => value !== undefined).length / 8, risks, controls, questions, applicableReferences: relevant.filter(source => applicableIds.has(source.id)).map(({ id, title, url, status, hierarchyLevel }) => ({ id, title, url, status, hierarchyLevel })), conditionalReferences: relevant.filter(source => conditionalIds.has(source.id) || (!applicableIds.has(source.id) && !conditionalIds.has(source.id))).map(({ id, title, url, status, hierarchyLevel }) => ({ id, title, url, status, hierarchyLevel })), references: relevant.map(({ id, title, url, verifiedAt, status, summary, hierarchyLevel }) => ({ id, title, url, verifiedAt, status, summary, hierarchyLevel })), obligations, complianceScores, improvementPlan, disclaimer: localized(language, 'Orientación preliminar; requiere confirmar hechos, sujetos y ámbito de aplicación. Esta herramienta no constituye dictamen ni certificación jurídica.', 'Preliminary guidance; confirm facts, parties and scope of application. This tool is not a legal opinion or certification.') };
}
export function auditChecklist(project: ProjectProfile, sources: LegalSource[], language: Language = 'es') { const a = assessProject(project, sources, language); return { project: a.project, language, items: [...a.obligations.map((obligation) => ({ id: obligation.id, text: obligation.requirement, norm: obligation.normTitle, article: obligation.article, whyItApplies: obligation.whyItApplies, applicabilityReason: obligation.applicabilityReason, missingInformation: obligation.missingInformation, evidence: obligation.evidence, gap: obligation.gap, recommendedActions: obligation.recommendedActions, status: obligation.status, legalReviewRequired: obligation.legalReviewRequired, priority: obligation.priority, risk: obligation.risk, owner: obligation.owner, dueDate: obligation.dueDate, closureCriterion: obligation.closureCriterion, sourceUrl: obligation.sourceUrl })), ...a.controls.map((text) => ({ text, evidence: localized(language, 'Definir evidencia y responsable', 'Define evidence and owner'), status: 'pendiente' as const, priority: 'media' as const })), { text: localized(language, 'Revisar fuentes y vigencia', 'Review sources and legal status'), evidence: a.references.map((r) => r.url).join(', '), status: 'pendiente' as const, legalReviewRequired: true, priority: 'alta' as const }], scores: a.complianceScores, improvementPlan: a.improvementPlan, disclaimer: a.disclaimer }; }
