import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Las fechas deben usar YYYY-MM-DD y existir en el calendario');
const httpsUrl = z.string().url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'La fuente debe usar una URL HTTPS sin credenciales');
const localizedText = z.object({ es: z.string().min(1), en: z.string().min(1) });
const legalStatus = z.enum(['vigente', 'reformado', 'derogado', 'pendiente_verificacion']);
export const hierarchyLevel = z.enum(['constitucion', 'tratado_internacional', 'ley_organica', 'ley_ordinaria', 'codigo', 'reglamento', 'resolucion', 'normativa_sectorial', 'normativa_tributaria', 'estandar_tecnico']);
const historyEvent = z.object({
  type: z.enum(['publicacion', 'reforma', 'derogacion', 'sustitucion', 'reglamento', 'resolucion', 'expedicion']),
  date: date.optional(), officialGazette: z.string().optional(), title: z.string().min(1),
  sourceUrl: httpsUrl, notes: z.string().optional(),
});
export const legalSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().trim().min(1),
  type: z.string().min(1), issuer: z.string().trim().min(1), jurisdiction: z.string().trim().min(1),
  hierarchyLevel: hierarchyLevel.optional(),
  sourceKind: z.enum(['norma', 'portal']).optional(),
  publishedAt: date.nullable(), issuedAt: date.optional(), verifiedAt: date, status: legalStatus, legalEffect: z.enum(['publicada_pendiente_revision', 'vigente_documental', 'vigencia_pendiente_publicacion']).optional(),
  url: httpsUrl, documentUrl: httpsUrl.optional(), topics: z.array(z.string().min(1)), summary: z.string().optional(),
  officialGazette: z.object({ number: z.string().optional(), edition: z.string().optional(), page: z.string().optional() }).optional(),
  history: z.array(historyEvent).optional(), relatedSourceIds: z.array(z.string()).optional(),
  verification: z.object({
    urlCheckedAt: date.optional(), documentaryReviewedAt: date.optional(), legalReviewedAt: date.optional(),
    statusBasis: z.enum(['documental_oficial', 'revision_juridica_humana']).optional(),
    reviewer: z.string().optional(), reviewerType: z.enum(['humana', 'automatizada']).optional(), notes: z.string().optional(),
    documentaryStatus: z.enum(['revisado', 'parcial', 'pendiente']).optional(),
  }).optional(),
  obligations: z.array(z.object({
    id: z.string().min(1), article: z.string().min(1), sourceUrl: httpsUrl, appliesWhenRules: z.array(z.enum(['processesPersonalData', 'usesProviders', 'sellsOnline', 'storesSensitiveData', 'handlesPayments', 'issuesInvoices', 'internationalTransfers', 'hasEmployees', 'hasMinors', 'usesAi', 'offersRegulatedFinancialService', 'isCompany', 'operatesTelecomNetwork', 'providesPrivateSecurity', 'processesPublicSectorData', 'largeScaleProcessing', 'usesBiometrics', 'hasSecurityIncident', 'providesDigitalService', 'operatesCriticalEssentialService'])).optional(),
    requirement: localizedText, appliesWhen: localizedText, evidence: z.array(localizedText).min(1),
    consequence: localizedText.optional(), exposure: z.enum(['baja', 'media', 'alta', 'critica']).optional(), sanctionType: localizedText.optional(), authority: localizedText.optional(), preventiveActions: z.array(localizedText).optional(),
    documentaryReviewedAt: date,
  })).optional(),
});
export type LegalSource = z.infer<typeof legalSourceSchema>;
export type LegalStatus = z.infer<typeof legalStatus>;
export type LegalHistoryEvent = z.infer<typeof historyEvent>;
export type LegalEventType = LegalHistoryEvent['type'];
export function validateLegalSource(source: unknown): source is LegalSource {
  legalSourceSchema.parse(source);
  return true;
}
