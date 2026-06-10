# El Buen Agente — MCP Server

Servidor MCP público que convierte la guía **"El Buen Agente"** (criterios canónicos para construir agentes LLM robustos) en **17 tools accionables**: en vez de leer una guía, le pasás la definición de tu agente y te devuelve evaluaciones estructuradas, un contrato formal, un checklist de 19 puntos como gate de merge, y la definición final lista para usar.

**Endpoint público:** `https://el-buen-agente-mcp-production.up.railway.app/mcp`

## Conectar

**Claude Code:**

```bash
claude mcp add --transport http el-buen-agente https://el-buen-agente-mcp-production.up.railway.app/mcp
```

**Cursor / Claude Desktop / cualquier cliente MCP:** agregá la URL como servidor HTTP (Streamable HTTP, sin autenticación).

## El flujo

El servidor recomienda el orden solo (vía `instructions`, hints de siguiente paso en cada respuesta, y la tool `recomendar_flujo`):

```
Agente NUEVO:
evaluar_necesidad → revisar_rol_y_frontera → revisar_outputs → evaluar_autonomia
→ revisar_frontera_ejecucion → auditar_contexto → disenar_evaluacion
→ generar_contrato → checklist_nacimiento (GATE) → construir_agente → plan_de_inicio

Agente EXISTENTE:
checklist_nacimiento (diagnóstico) → tools de las secciones con ❌ → re-correr checklist
```

## Tools

| Tool | Sección | Qué hace |
|---|---|---|
| `recomendar_flujo` | — | Devuelve el plan ordenado según la situación (nuevo/existente) |
| `evaluar_necesidad` | §0 | ¿Hace falta un agente o alcanza con menos? Detecta antipatrones |
| `revisar_rol_y_frontera` | §1 | Rol claro, dominio acotado, qué NO hace |
| `revisar_outputs` | §2 | Schema estricto, resumen humano, gates expuestos |
| `evaluar_autonomia` | §3 | Copiloto / supervisado / autónomo + guardrails |
| `revisar_frontera_ejecucion` | §4 | Qué recomienda vs qué ejecuta (status + gates en código) |
| `aplicar_challenger` | §5 | Red-team de la definición completa |
| `challenger_decision` | §5 | "3 razones para NO hacer esto" sobre una decisión puntual |
| `auditar_contexto` | §6 | 3 capas, caducidad, governance, anti prompt-injection |
| `disenar_evaluacion` | §7 | Métricas, golden set, monitoreo de drift |
| `generar_contrato` | §8 | Contrato formal del agente (determinístico) |
| `evaluar_sistema` | §9 | Encaje en el ecosistema de agentes existente |
| `plan_exposicion_mcp` | §10 | Qué exponer como tool/resource/prompt |
| `checklist_nacimiento` | §11 | Gate de merge: 19 puntos con veredicto apto/no apto |
| `construir_agente` | — | Cierre del ciclo: genera la definición final (markdown / SKILL.md / system prompt) |
| `plan_de_inicio` | §12 | Plan de despliegue: copiloto → autonomía por evidencia |
| `get_el_buen_agente` | — | La guía completa en Markdown |

También expone la guía como **resource** (`guide://el-buen-agente`) y **prompt**.

## Cómo funciona

Cada tool empaqueta los criterios de su sección + la definición del agente + un formato de salida estricto (scorecard ✅/⚠️/❌, evidencia citada, máx. 5 recomendaciones, semáforo). El agente que consume la tool ejecuta la evaluación con ese marco: el criterio viaja con la tool, sin importar qué LLM la use.

## Desarrollo

```bash
npm install
npm start          # http://localhost:3000/mcp
```

La guía fuente es [`el_buen_agente.md`](el_buen_agente.md) — el servidor la parsea por secciones al arrancar. Para cambiar los criterios, editá ese archivo.

**Stack:** Node 18+, Express, [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) (Streamable HTTP, stateless). Rate limit: 60 req/min por IP, 600 global.

## Licencia

MIT
