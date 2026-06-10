---
name: el-buen-agente-v2
description: Guía canónica y genérica para crear un agente LLM robusto y performante en CUALQUIER sistema. Cargala antes de diseñar, scaffoldear o revisar un agente. Cubre cuándo construir (y cuándo no), anatomía mínima, contexto como activo, evaluación, el contrato de agente, la transición a sistema coherente y la exposición vía MCP. Independiente de stack, lenguaje y dominio.
allowed-tools: Read Glob Bash
context: fork
---

# El Buen Agente (v2, canónica) — guía definitiva para construir agentes LLM

> Versión genérica y portable. No asume stack, lenguaje ni dominio. 
>
> Regla de oro: un agente nuevo debe **nacer** cumpliendo el checklist de §11,
> no corregirse después. La ventaja competitiva no está en el modelo (es
> commodity): está en el **criterio, el contexto y la evaluación**.

---

## 0. Antes de crear: ¿de verdad hace falta un agente?

El error más caro es construir un agente para algo que se resuelve con menos.
Subí de nivel solo cuando el anterior no alcanza. La mayoría de los problemas
viven en los niveles 1 a 3.

| Nivel | Qué es | Quién dirige el flujo |
|---|---|---|
| 1. Prompt | Instrucción única, sin estado | El humano, una vez |
| 2. Workflow | Pasos predefinidos, LLM como nodo | El código |
| 3. Skill | Conocimiento empaquetado reutilizable, acotado a un dominio | El LLM, dentro del skill |
| 4. Agente | Loop observar → razonar → actuar con herramientas, hasta resolver | El LLM, dinámicamente |
| 5. Multi-agente | Varios agentes coordinados, cada uno con rol | Un orquestador |

**Tiene sentido un agente cuando**: múltiples pasos con decisiones intermedias,
acceso a varias fuentes, razonamiento real (no solo ejecución), y es recurrente.
**No tiene sentido cuando**: un prompt o un script lo resuelven; si no hay datos
ni herramientas que mejoren la respuesta, el agente no aporta nada.

**Antipatrones (no caer):**

| Antipatrón | Síntoma | Alternativa |
|---|---|---|
| Agente genérico | "uno que hace todo", mediocre en todo | Un dominio, herramientas justas, frontera clara (§1) |
| Sobre-orquestación | 10 agentes para algo que uno resuelve | Empezar simple, sumar complejidad cuando el problema lo pida |
| Agente sin contexto | LLM potente sin info del dominio | Invertir en contexto antes que en el agente (§6) |
| Autonomía total día 1 | esperar que opere solo sin supervisión | Empezar copiloto, ampliar autonomía al validar (§3) |

---

## 1. Rol claro y frontera de responsabilidad

Todo agente define **qué problema resuelve y qué NO es su responsabilidad**.
Sin frontera, intenta hacer demasiado y lo hace mal. Especialista, no
generalista: un dominio acotado da contexto más preciso, evaluación más clara
y composición. La frontera se escribe en el **identity layer** (read-only,
inyectado en cada decisión) y, donde se pueda, se **enforcea en código** (no
solo en el prompt).

---

## 2. Inputs esperados y outputs útiles para humanos

Un output que nadie puede accionar es peor que no tener agente: genera la
ilusión de "ya usamos IA". El output debe ser accionable sin post-proceso.
Buenas prácticas:
- **Schema estricto** (ej. Pydantic / JSON Schema): si no parsea, se descarta
  sin ejecutar.
- Un campo de **resumen legible** para el humano, separado del razonamiento
  completo.
- Exponer **qué chequeos pasó/falló** (gates), no solo el resultado.

---

## 3. Nivel de autonomía permitido

Tres niveles, de menor a mayor riesgo. **La mayoría debe empezar como copiloto
y progresar cuando se valida la fiabilidad.**

| Nivel | Qué hace | Control humano |
|---|---|---|
| Copiloto | Sugiere, el humano decide y ejecuta | Alto |
| Ejecutor supervisado | Actúa, pero su output necesita aprobación antes de tener efecto | Medio |
| Autónomo con guardrails | Actúa directo, alerta en excepciones | Bajo |

Mecanismos que bajan el riesgo del modo autónomo: **sandbox / shadow mode**
(paper-only antes de tener efecto real), **límites duros no bypasseables**,
**frenos progresivos** ante degradación, y **override con aprobación humana**
para excepciones. La progresión de autonomía es **por evidencia** (métricas),
no por intuición.

---

## 4. Qué recomienda y qué ejecuta (frontera explícita desde el diseño)

La línea entre lo que el agente recomienda y lo que ejecuta debe estar en el
código, no descubrirse en producción. Patrón robusto: el agente produce una
decisión con un `status` que determina si se ejecuta:
- Dentro de límites → ejecuta.
- Viola un límite duro → queda pendiente de aprobación humana (no ejecuta).
- Falla un gate (input inválido, baja confianza, freno activo) → rechazada.
- Cambios estructurales / irreversibles → **propone**, el humano aprueba.

---

## 5. Relación con el humano: copiloto, reviewer, challenger

La relación más productiva no es subordinación ni delegación total. El rol más
valioso (y menos intuitivo) es el de **challenger**: que cuestione la decisión
con contraargumentos basados en datos. Implementaciones:
- **Challenger / red-team**: una 2da pasada que pide "3 razones para NO hacer
  esto" y se muestra al humano (no bloquea, pero informa).
- **Autocrítica**: el agente revisa periódicamente sus propias decisiones
  recientes.
- **Gate de calidad**: obliga al agente a auto-evaluar si su justificación
  cumple criterios mínimos; si no, no actúa (sin castigar el "no sé").

---

## 6. El contexto como activo estratégico

> Lo que diferencia a un agente que genera valor de uno que genera ruido no es
> el modelo, es la calidad de la información que tiene. "Context engineering"
> (Karpathy): el LLM es la CPU, la context window es la RAM.

### 6.1 Tres capas de contexto (separadas)

| Capa | Qué contiene | Cómo se carga | Dónde vive |
|---|---|---|---|
| Identidad | Rol, principios, límites, formato de output | Siempre, en cada decisión | Prompt / archivo read-only versionado |
| Dominio | Cifras y hallazgos que envejecen | On-demand, regenerable | Doc editable (Markdown, git) |
| Referencia | Lecciones, post-mortems, decisiones pasadas | Bajo demanda vía retrieval/RAG | Store + índice semántico |

Separá: **prompt** (rol + comportamiento + formato) / **docs externos**
(producto, negocio, equipo, editables sin tocar el agente) / **herramientas**
(APIs, DB, datos que cambian seguido).

### 6.2 Tipos de contexto que sirven (no todo vale)

Más contexto NO es mejor: el "context rot" degrada el razonamiento. Un dato es
útil solo si es **específico**, **actualizado** y **relevante** al dominio.
Info obsoleta es peor que no tener info: el agente la trata como verdad.

### 6.3 Integración con datos internos

Estrategias: **acceso directo** (datos que cambian seguido), **snapshot
periódico** (semanal/mensual), **RAG** (grandes volúmenes no estructurados),
**contexto estático** (cambia muy poco). Conectar demasiado degrada: relevancia,
frecuencia y sensibilidad deciden qué conectar. A veces la mejor decisión es NO
conectar un dato (calidad dudosa, sesgo, legal sin resolver).

### 6.4 Gobernanza ligera (tratar el contexto como código)

- **Ownership**: cada doc de contexto tiene responsable.
- **Versionado en git** + revisión antes de cada cambio.
- **Changelog**: qué cambió, cuándo, por qué, qué efecto tuvo.
- **Caducidad**: cada dato que envejece lleva fecha de revisión; un check
  automático avisa cuando vence.
- **Separar cambios de contexto de cambios de código**: cuando algo falla,
  poder aislar el origen ahorra horas.

### 6.5 Seguridad y cumplimiento

- **Least-privilege**: el agente accede solo a lo que su dominio necesita.
- **Trazabilidad**: registrar qué consultó, qué razonó, qué recomendó/ejecutó
  (audit log; para alto stake, hash chain + reproducibilidad de la decisión).
- **Prompt injection**: todo input externo (emails, docs de terceros, datos de
  usuarios) se sanitiza y se marca como **dato, no instrucción**; el system
  prompt instruye al modelo a ignorar comandos embebidos. Considerá el marco
  regulatorio aplicable (ej. EU AI Act: transparencia, supervisión humana).

---

## 7. Cómo saber si un agente funciona bien

> "La respuesta parece buena" no es una métrica. Evaluá **resultados, no
> caminos**: un agente que llega a la respuesta correcta por una ruta
> inesperada sigue funcionando.

### 7.1 Tres dimensiones (Google)
1. **Capacidades**: ¿usa las herramientas correctas? ¿razona sobre el problema?
2. **Trayectoria**: ¿los pasos intermedios son adecuados? ¿consultó las fuentes
   relevantes? (registrá gates + el snapshot de datos que vio).
3. **Resultado**: ¿la respuesta es precisa, relevante, completa?

### 7.2 Métricas

| Métrica | Qué mide | Por qué importa |
|---|---|---|
| Tasa de éxito | ¿completó la tarea? | Debajo de ~80% el equipo pierde confianza |
| Consistencia | ¿misma entrada → misma salida? | Si acierta la mitad de las veces, no es integrable |
| Coste por tarea | tokens × tarifa + llamadas a APIs | Sin esto no hay cálculo de ROI; un agente puede funcionar pero no ser rentable |
| Adopción | ¿lo usan? ¿con qué frecuencia? | Si nadie lo usa, da igual que funcione en tests |

Para decisiones de alto stake, sumá **self-consistency**: correr N veces y, si
las corridas divergen, no ejecutar (halt/fallback + log para review).

### 7.3 Tres niveles de evaluación
1. **Antes de desplegar (golden set)**: 20-50 tareas reales con criterio de
   éxito tan claro que dos personas lleguen al mismo veredicto. Se corren antes
   de cada cambio de prompt, como tests de regresión.
2. **En producción**: monitoreo continuo de una muestra para detectar
   degradación/drift a lo largo del tiempo.
3. **Revisión humana periódica**: calibrar los casos que el evaluador
   automático marca como dudosos.

---

## 8. De agente a contractor: el contrato

Cuando el agente asume tareas complejas, tratarlo como "caja negra" deja de
funcionar. Formalizalo como a un proveedor.

```
AGENTE: <nombre>
PROBLEMA: qué resuelve (1 frase) + qué deliberadamente NO toca
INPUTS: qué consume
OUTPUT: schema exacto + formato legible para humano
PUEDE: acciones autónomas dentro de límites
NO PUEDE: acciones que requieren aprobación humana / fuera de alcance
COSTE: modelo + estimado de tokens/mes + tope
EVALUACIÓN: métricas de éxito (verde/amarillo/rojo) + cadencia de review
AUTONOMÍA: copiloto | supervisado | autónomo con guardrails (+ plan de progresión)
```

---

## 9. De skills aisladas a sistema coherente

- **Catálogo de skills a nivel compañía**: una librería interna donde los skills
  están documentados y disponibles para cualquier equipo, para evitar que cada
  área reinvente lo mismo.
- **Reutilización vs especialización**: empezá específico (un skill excelente
  para un dominio); generalizá solo cuando hay demanda real de otros equipos.
- **Orquestación ligera vs agente orquestador**: para la mayoría alcanza la
  orquestación ligera (los agentes corren independientes, el humano combina).
  El agente orquestador se justifica con volumen alto + patrones de
  coordinación bien definidos.
- **Automatizar vs supervisión humana**: automatizá cuando el error es de bajo
  impacto y reversible, frecuente, con reglas claras y precisión demostrada.
  Mantené humano cuando afecta clientes/revenue/reputación, requiere matices, o
  el agente es nuevo en el dominio.
- **Memorias separadas por agente**: si dos agentes comparten filosofía y
  memoria, uno sobra.

---

## 10. Economía de agentes: exponer la skill/servicio vía MCP

Hay una dimensión externa: está emergiendo una **economía de agentes**. Los
agentes (propios y de terceros) consumen los servicios que les son accesibles;
los que no lo son quedan fuera del flujo.

- **MCP (Model Context Protocol)**: estándar abierto ("USB-C para agentes")
  para que cualquier agente compatible se conecte a un servicio. Un servidor
  MCP puede exponer **tools** (funciones), **resources** (docs/datos legibles)
  y **prompts** (plantillas reutilizables).
- **Exponer una skill/guía como MCP**: una guía como esta se modela
  naturalmente como un **resource** (documento legible) o un **prompt**
  (plantilla), de modo que cualquier agente MCP (Claude, Cursor, etc.) la pueda
  cargar bajo demanda. Una capacidad accionable (ej. "scaffoldear un agente")
  se modela como un **tool**.
- **A2A (Agent-to-Agent)**: complementa MCP; conecta agentes con otros agentes
  (orquestación, delegación). MCP conecta agente↔herramienta; A2A agente↔agente.
- **Pregunta de diseño**: ¿qué merece ser una pantalla y qué conviene exponer
  como API/MCP para que lo consuman agentes? Una UI simplifica el backend para
  humanos; un agente puede encadenar operaciones que ninguna pantalla permite.

---

## 11. Checklist de nacimiento de un agente

Antes de mergear un agente nuevo, verificá:

1. Rol + frontera (qué SÍ / qué NO) en el identity layer.
2. Output con schema estricto + resumen legible para humano.
3. Frontera recomienda/ejecuta explícita (status + gates).
4. Límites duros no bypasseables, enforced en código.
5. Sandbox / shadow mode con salida automática.
6. Frenos progresivos ante degradación (si maneja recursos sensibles).
7. Override con aprobación humana para excepciones.
8. Challenger / adversarial review.
9. Contexto en 3 capas separadas (identidad / dominio / referencia).
10. Sanitización de inputs externos + instrucción anti-injection.
11. Trazabilidad: audit log (+ hash chain si el stake es alto).
12. Memoria propia + decay + retrieval relevante.
13. Retry con backoff en las llamadas al modelo / APIs.
14. Contrato formal (§8) documentado.
15. Coste por tarea trackeado + tope.
16. Self-consistency en decisiones de alto stake.
17. Golden set de 20-50 tareas con criterio de éxito claro.
18. Caducidad (fecha de revisión) en los datos de contexto que envejecen.
19. Monitoreo de drift/degradación en producción + cadencia de revisión humana.

---

## 12. Cómo empezar

El primer paso no es un proyecto piloto de doce meses. Es **un agente, un
problema concreto, un humano revisando su output**. Elegí una tarea que ya se
haga hoy, recurrente, que consuma tiempo y tenga datos accesibles. Empezá como
copiloto y comparalo con cómo se hacía antes. Si ahorra tiempo sin perder
calidad, funciona; escalá cuando el equipo deja de revisar cada respuesta. Si
no funciona, al menos costó poco averiguarlo.

Los proyectos que fallan comparten un patrón: agentes genéricos, sin contexto,
aislados del trabajo real. Los que funcionan: especializados, con acceso a los
datos que necesitan, integrados en una decisión concreta que el equipo ya toma.

---

*Guía v2 canónica y genérica. Portable a cualquier sistema: copiá este archivo 
a `.claude/skills/<nombre>/SKILL.md` (oel formato de skill de tu herramienta) 
para cargarla bajo demanda.*
