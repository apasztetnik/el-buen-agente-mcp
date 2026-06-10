# Golden set del servidor

Fixtures de definiciones de agentes con **veredicto esperado**, según §7 de la propia guía: criterio de éxito tan claro que dos evaluadores lleguen al mismo resultado.

## Dos niveles de uso

**1. Tests determinísticos (automático, CI)** — `npm test` verifica que el servidor arma los briefs correctamente: criterios de la sección correcta, definición embebida sin truncar, formato de salida, hints de flujo, soporte `language:"en"`, contrato exacto. Corre en cada push y bloquea el deploy si falla.

**2. Evaluación LLM (manual, antes de cambios grandes en la guía)** — pasale cada fixture a un agente conectado al servidor y compará contra el veredicto esperado anotado en el encabezado del fixture:

| Fixture | Tool | Veredicto esperado |
|---|---|---|
| `facturabot-v1.md` | `checklist_nacimiento` | NO APTO (≤2 ⚠️, ≥15 ❌) |
| `facturabot-v1.md` | `evaluar_autonomia` | 🔴 rojo |
| `facturabot-v1.md` | `evaluar_necesidad` | 🟡 + nivel mínimo "workflow + agente para excepciones" |
| `facturabot-v2.md` | `checklist_nacimiento` | APTO (≥16 ✅, 0 ❌) |
| `facturabot-v2.md` | `evaluar_autonomia` | 🟢 verde |

Si un cambio en `el_buen_agente.md` o en los briefs hace que estos veredictos cambien, es una regresión (o un cambio de criterio deliberado que hay que documentar acá).

**Para agregar un fixture:** definición + veredicto esperado en el encabezado + fila en la tabla.
