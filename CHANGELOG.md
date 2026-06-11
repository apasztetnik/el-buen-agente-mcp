# Changelog

Todas las versiones notables de este proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/); el proyecto sigue [SemVer](https://semver.org/lang/es/).

Las versiones se publican al pushear un tag `vX.Y.Z`: el CI corre los tests, Railway despliega solo con el check verde, y una GitHub Action publica al registry oficial de MCP.

## [Sin publicar]

## [2.8.1] - 2026-06-11

### Cambiado
- Documentación al día con el tono actual: README (ES/EN), golden/README.md y los fixtures golden ya no describen las respuestas con el sistema viejo de íconos (scorecard ✅/⚠️/❌, semáforo 🔴🟡🟢); ahora usan los estados en palabras (cumple/parcial/falta) y el veredicto (verde/amarillo/rojo), igual que la salida real desde v2.7. Las instrucciones de flujo del servidor también dejan de referirse a "secciones con ❌".

## [2.8.0] - 2026-06-11

### Agregado
- Sección "Lo que necesito de vos" en el formato de salida: convierte los huecos que solo el autor puede resolver en hasta tres preguntas concretas, cada una atada a su hallazgo, en vez de que el agente consumidor improvise preguntas genéricas y desconectadas al final. No pregunta si con la información disponible alcanza (no es una encuesta). Resuelve el salto raro entre las recomendaciones y unas pocas preguntas sueltas (feedback de uso).

## [2.7.1] - 2026-06-10

### Cambiado
- §1 de la guía: define "identity layer" en su primera aparición y aclara que el rol es el contenido y el identity layer es el lugar inmutable donde vive, para que las evaluaciones no presenten ambos términos como jerga separada (feedback de usuario).
- README (ES y EN): sección de descripción detallada que explica el modelo (el servidor no llama a ningún modelo ni guarda datos; el cómputo corre del lado del cliente) y los dos escenarios de uso.

## [2.7.0] - 2026-06-10

### Cambiado
- Tono profesional en los resultados de las tools: estructura Resumen / Evaluación / Recomendaciones / Veredicto, estados como "cumple / parcial / falta" en vez de semáforos de colores, y se quitaron los emojis decorativos de encabezados y landing.

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

[Sin publicar]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.8.1...HEAD
[2.8.1]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.8.0...v2.8.1
[2.8.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.7.1...v2.8.0
[2.7.1]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/apasztetnik/el-buen-agente-mcp/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/apasztetnik/el-buen-agente-mcp/releases/tag/v2.2.0
