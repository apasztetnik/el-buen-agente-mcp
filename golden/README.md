# Golden set del servidor

Fixtures de definiciones de agentes con **veredicto esperado**, según §7 de la propia guía: criterio de éxito tan claro que dos evaluadores lleguen al mismo resultado.

## Dos niveles de uso

**1. Tests determinísticos (automático, CI)**: `npm test` verifica que el servidor arma los briefs correctamente: criterios de la sección correcta, definición embebida sin truncar, formato de salida, hints de flujo, soporte `language:"en"`, contrato exacto. Corre en cada push y bloquea el deploy si falla.

**2. Evaluación LLM (a demanda, antes de cambios grandes en la guía)**: automatizada en [`eval/golden-eval.mjs`](../eval/golden-eval.mjs). Levanta el servidor, arma los briefs reales, los ejecuta con un modelo y compara veredictos:

```bash
npm run eval:golden              # necesita ANTHROPIC_API_KEY (~US$0.50-0.80 por corrida)
npm run eval:golden -- --dry-run # mecánica completa sin llamadas a la API (gratis)
EVAL_MODEL=claude-sonnet-4-6 npm run eval:golden   # con un modelo más barato
```

También existe como workflow manual en GitHub (`Golden Eval (LLM)` en la pestaña Actions; requiere el secret `ANTHROPIC_API_KEY`). Es deliberadamente manual: consume API y no conviene pagarla en cada push.

Casos y veredictos esperados:

| Fixture | Tool | Veredicto esperado |
|---|---|---|
| `facturabot-v1.md` | `checklist_nacimiento` | NO APTO (≤2 ⚠️, ≥15 ❌) |
| `facturabot-v1.md` | `evaluar_autonomia` | 🔴 rojo |
| `facturabot-v1.md` | `evaluar_necesidad` | 🟡 + nivel mínimo "workflow + agente para excepciones" |
| `facturabot-v2.md` | `checklist_nacimiento` | APTO (≥16 ✅, 0 ❌) |
| `facturabot-v2.md` | `evaluar_autonomia` | 🟢 verde |

Si un cambio en `el_buen_agente.md` o en los briefs hace que estos veredictos cambien, es una regresión (o un cambio de criterio deliberado que hay que documentar acá).

**Para agregar un fixture:** definición + veredicto esperado en el encabezado + fila en la tabla.
