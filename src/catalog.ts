import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLegalSource, type LegalSource } from './domain.js';

function inferHierarchy(source: LegalSource): LegalSource {
  if (source.hierarchyLevel) return source;
  if (source.type === 'constitución') return { ...source, hierarchyLevel: 'constitucion' };
  if (/tratado|convenio/i.test(source.type)) return { ...source, hierarchyLevel: 'tratado_internacional' };
  if (source.type === 'reglamento') return { ...source, hierarchyLevel: 'reglamento' };
  if (source.type === 'resolución') return { ...source, hierarchyLevel: 'resolucion' };
  if (source.type === 'normativa-sectorial') return { ...source, hierarchyLevel: 'normativa_sectorial' };
  if (/est[aá]ndar t[eé]cnico/i.test(source.type)) return { ...source, hierarchyLevel: 'estandar_tecnico' };
  if (/tributaria/i.test(source.type)) return { ...source, hierarchyLevel: 'normativa_tributaria' };
  if (/normativa/i.test(source.type)) return { ...source, hierarchyLevel: 'normativa_sectorial' };
  if (/c[oó]digo/i.test(source.type)) return { ...source, hierarchyLevel: 'codigo' };
  if (/org[aá]nica|reformatoria/i.test(source.title)) return { ...source, hierarchyLevel: 'ley_organica' };
  if (source.type === 'ley') return { ...source, hierarchyLevel: 'ley_ordinaria' };
  return source;
}

export class LegalCatalog {
  constructor(private readonly sources: LegalSource[]) {}
  static async load(path = resolve(dirname(fileURLToPath(import.meta.url)), '../data/normativa.json')) {
    const raw = JSON.parse(await readFile(path, 'utf8')) as unknown[];
    if (!Array.isArray(raw)) throw new Error('El catálogo debe ser un arreglo');
    raw.forEach(validateLegalSource);
    const ids = new Set<string>();
    for (const source of raw as LegalSource[]) { if (ids.has(source.id)) throw new Error(`Identificador duplicado: ${source.id}`); ids.add(source.id); }
    for (const source of raw as LegalSource[]) {
      if (source.status !== 'pendiente_verificacion' && source.legalEffect !== 'vigencia_pendiente_publicacion') {
        const verification = source.verification;
        const humanReview = Boolean(verification?.statusBasis === 'revision_juridica_humana' && verification.legalReviewedAt && verification.reviewerType === 'humana' && verification.reviewer && !/codex|asistida|autom[aá]tica|automated/i.test(verification.reviewer));
        const officialDocumentaryBasis = Boolean(verification?.statusBasis === 'documental_oficial' && verification.documentaryReviewedAt && verification.documentaryStatus === 'revisado' && source.history?.some(event => event.sourceUrl.startsWith('https://')));
        if (!humanReview && !officialDocumentaryBasis) throw new Error(`Norma confirmada sin base de verificación declarada: ${source.id}`);
      }
      if (source.legalEffect === 'vigencia_pendiente_publicacion' && (source.status !== 'pendiente_verificacion' || source.publishedAt !== null)) throw new Error(`Norma sin publicación confirmada no puede tratarse como vigente: ${source.id}`);
      for (const related of source.relatedSourceIds ?? []) if (!ids.has(related)) throw new Error(`Referencia normativa desconocida: ${related}`);
      const obligations = (source.obligations ?? []).map(item => item.id);
      if (new Set(obligations).size !== obligations.length) throw new Error(`Obligaciones duplicadas: ${source.id}`);
    }
    return new LegalCatalog((raw as LegalSource[]).map(inferHierarchy));
  }
  search(query = '', topic?: string) { const q = query.trim().toLowerCase(); const t = topic?.trim().toLowerCase(); return this.sources.filter((s) => (!q || `${s.id} ${s.title} ${s.summary ?? ''} ${s.topics.join(' ')}`.toLowerCase().includes(q)) && (!t || s.topics.some((item) => item.toLowerCase() === t))); }
  get(id: string) { return this.sources.find((s) => s.id === id); }
  all() { return [...this.sources]; }
}
