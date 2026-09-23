# Revisión del catálogo jurídico

## Flujo reproducible

```bash
npm run catalog:discover
npm run catalog:verify
npm run catalog:import
npm run catalog:review
npm run catalog:coverage
```

Los comandos equivalentes funcionan con `pnpm run` y `bun run`.

## Criterios de incorporación

Una fuente solo se incorpora al catálogo publicado después de:

1. Confirmar que proviene de un dominio oficial.
2. Registrar título, tipo, fecha, identificador y URL.
3. Conservar evidencia de Registro Oficial cuando exista.
4. Revisar manualmente reformas, derogaciones, sustituciones y ámbito.
5. Marcar por separado accesibilidad, revisión documental y vigencia jurídica.
6. Registrar `reviewerType: "humana"` y `reviewer` identificable solo después de una revisión jurídica real. La revisión automatizada/documental no permite declarar vigencia.
7. Ejecutar pruebas y revisar el cambio antes de publicar.

## Monitoreo periódico

El workflow semanal produce cuatro evidencias separadas: descubrimientos candidatos, accesibilidad de URLs, informe de indicios de reformas/derogaciones y cobertura por nivel. El informe automático no modifica el estado de una norma ni demuestra exhaustividad. Las nuevas entradas permanecen fuera del catálogo curado hasta que se identifiquen texto, publicación, reformas y ámbito.

La evaluación de proyectos puede devolver normas aplicables o condicionales. Un supuesto desconocido debe permanecer condicional y convertirse en pregunta; una señal encontrada en código no prueba por sí sola una actividad legalmente relevante.

Una fuente descubierta automáticamente permanece pendiente; nunca se interpreta como norma vigente por defecto.
