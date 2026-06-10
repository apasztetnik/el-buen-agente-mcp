# Changelog

Todas las versiones notables de este proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/); el proyecto sigue [SemVer](https://semver.org/lang/es/).

Las versiones se publican al pushear un tag `vX.Y.Z`: el CI corre los tests, Railway despliega solo con el check verde, y una GitHub Action publica al registry oficial de MCP.

## [Sin publicar]

## [2.6.0] - 2026-06-10

### Agregado
- Tool `validar_veredicto`: declara un `outputSchema` real y devuelve `structuredContent` validado por el SDK (conteos + veredicto normalizado, apto solo si faltas === 0). Da el contrato del checklist a nivel protocolo MCP, sin depender de parsear texto. 18 tools en total.

### Cambiado
- El bloque máquina de `checklist_nacimiento` ahora apunta a `validar_veredicto` para el contrato validado.

## [2.5.0] - 2026-06-10

### Agregado
- Resources por sección: `guide://el-buen-agente/seccion/{0-12}` vía `ResourceTemplate`, para cargar solo el criterio que se necesita en lugar de la guía completa.
- Test guardián que prohíbe el guión largo (em dash, U+2014) en todo archivo del repo y en las respuestas vivas del servidor; si reaparece, el CI falla y el deploy se bloquea.

### Cambiado
- Regla de estilo en los briefs: las evaluaciones generadas por los agentes consumidores tampoco usan el guión largo.
- Purga del guión largo en todo el código, documentación y textos del servidor.

## [2.4.0] - 2026-06-10

### Agregado
- Bloque JSON de claves estables (`apto`/`no_apto`, independiente del idioma) al final de `checklist_nacimiento`, para usar el servidor como gate en CI.
- Landing page HTML en `/` (antes devolvía JSON crudo); el JSON de estado se movió a `/health`.
- Analytics mínimas: un log estructurado por tool call con nombre de la tool e idioma, nunca el contenido evaluado.

## [2.3.0] - 2026-06-10

### Agregado
- Soporte de idioma: todas las tools de evaluación aceptan `language: "en"` para salida en inglés.
- Publicación automática al registry oficial de MCP al pushear un tag `vX.Y.Z` (GitHub Action con autenticación OIDC).
- Golden set (`golden/`) con fixtures FacturaBot v1 (NO APTO) y v2 (APTO) y sus veredictos esperados.
- Suite de tests determinística (`npm test`) que verifica la estructura de los briefs, el flujo, los idiomas y el contrato; corre en CI y bloquea el deploy si falla.

## [2.2.0] - 2026-06-10

### Agregado
- Primera versión pública: la guía "El Buen Agente" expuesta como 17 tools accionables (una por sección, más `recomendar_flujo`, `generar_contrato` y `construir_agente`).
- Flujo guiado: instrucciones de orden en el handshake, hint de siguiente paso en cada respuesta, y la tool `recomendar_flujo`.
- `construir_agente` cierra el ciclo generando la definición final del agente (markdown, SKILL.md o system prompt).
- Salidas amigables con scorecard, evidencia y semáforo.
- Repositorio público en GitHub con deploy automático a Railway por push a `main`.
- Rate limiting (60 req/min por IP, 600 global) y cap de recursos del servicio.

[Sin publicar]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.6.0...HEAD
[2.6.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/apasztetnik/el-buen-agente-mcp/releases/tag/v2.2.0
