# El Buen Agente | MCP Server

[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.apasztetnik%2Fel--buen--agente--mcp-blue)](https://registry.modelcontextprotocol.io/v0/servers?search=el-buen-agente) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🇪🇸 [Versión en español](README.md)

A public MCP server that turns **"El Buen Agente"** (a canonical guide with criteria for building robust LLM agents) into **18 actionable tools**: instead of reading a guide, you pass it your agent's definition and it returns structured evaluations, a formal contract, a 19-point birth checklist as a merge gate, and the final agent definition ready to use.

## Detailed description

Most of an agent's value is not in the model (that is a commodity) but in the judgment behind its design: what role it has, what it must NOT do, how much autonomy it gets, what context it reasons with, and how you measure whether it works. That judgment usually lives in guides and documents nobody rereads when actually building. This server takes such a guide and makes it consultable at the exact moment of the work, as tools an agent can call.

The mechanism is deliberately simple and has one important consequence: **the server never calls a model and stores no data**. Each tool assembles a "brief" (its guide section's criteria, plus the agent definition you passed, plus a strict output format) and returns it. The evaluation itself is run by the LLM of the client consuming the MCP (your Claude Code, your Cursor), with each user's own credentials. In other words: the judgment travels inside the tool's text and the compute runs on your side. Nobody shares or pays for anyone else's API, and the definitions you evaluate never leave your environment (the server only logs the tool name, never the content).

It covers two scenarios:

- **Designing a new agent:** the flow starts by asking whether you even need an agent (often a prompt or a workflow is enough), and if you do, it walks you section by section up to the final checklist and a ready-to-use definition.
- **Auditing an existing agent:** you start with the checklist as a diagnosis and drill only into the dimensions that fail, with a measurable verdict that even works as a CI gate.

The evaluations are not a rubber stamp: the tool is strict on purpose (absence of evidence counts as a finding), because its value is in surfacing gaps before production, not in confirming everything is fine. Every tool also answers in English via `language: "en"`, and the underlying criteria live in a single versioned Markdown file, so improving the guide means editing one file and opening a PR.

**Public endpoint:** `https://el-buen-agente-mcp-production.up.railway.app/mcp`

## Connect

**Claude Code:**

```bash
claude mcp add --transport http el-buen-agente https://el-buen-agente-mcp-production.up.railway.app/mcp
```

**Cursor / Claude Desktop / any MCP client:** add the URL as an HTTP server (Streamable HTTP, no auth).

**English output:** every evaluation tool accepts `language: "en"`. The underlying guide is written in Spanish; the consuming agent translates the criteria on the fly.

## The flow

The server recommends the order on its own (via `instructions`, a next-step hint in every response, and the `recomendar_flujo` tool):

```
NEW agent:
evaluar_necesidad → revisar_rol_y_frontera → revisar_outputs → evaluar_autonomia
→ revisar_frontera_ejecucion → auditar_contexto → disenar_evaluacion
→ generar_contrato → checklist_nacimiento (GATE) → construir_agente → plan_de_inicio

EXISTING agent:
checklist_nacimiento (diagnosis) → tools for the failing sections → re-run checklist
```

## Tools

| Tool | Section | What it does |
|---|---|---|
| `recomendar_flujo` | - | Returns the ordered plan for your situation (new/existing agent) |
| `evaluar_necesidad` | §0 | Do you even need an agent, or would less do? Detects antipatterns |
| `revisar_rol_y_frontera` | §1 | Clear role, narrow domain, explicit NOT-list |
| `revisar_outputs` | §2 | Strict schema, human summary, exposed gates |
| `evaluar_autonomia` | §3 | Copilot / supervised / autonomous + guardrails |
| `revisar_frontera_ejecucion` | §4 | What it recommends vs what it executes (status + gates in code) |
| `aplicar_challenger` | §5 | Red-team of the full definition |
| `challenger_decision` | §5 | "3 reasons NOT to do this" on a single decision |
| `auditar_contexto` | §6 | 3 context layers, staleness, governance, prompt-injection defense |
| `disenar_evaluacion` | §7 | Metrics, golden set, drift monitoring |
| `generar_contrato` | §8 | Formal agent contract (deterministic) |
| `evaluar_sistema` | §9 | Fit within the existing agent ecosystem |
| `plan_exposicion_mcp` | §10 | What to expose as tool/resource/prompt |
| `checklist_nacimiento` | §11 | Merge gate: 19 points, fit/unfit verdict |
| `validar_veredicto` | - | Validates the checklist verdict with `outputSchema` (protocol-level contract for CI) |
| `construir_agente` | - | Closes the loop: generates the final definition (markdown / SKILL.md / system prompt) |
| `plan_de_inicio` | §12 | Rollout plan: copilot first, autonomy earned by evidence |
| `get_el_buen_agente` | - | The full guide in Markdown |

Also exposes the guide as a **resource** (`guide://el-buen-agente`, or per section: `guide://el-buen-agente/seccion/{0-12}`) and as a **prompt**.

## How it works

Each tool packages its section's criteria + your agent's definition + a strict output format (an assessment with meets/partial/missing states and cited evidence, up to 5 prioritized recommendations, a green/amber/red verdict, and the questions only the author can answer). The consuming agent runs the evaluation within that frame: the criteria travel with the tool, regardless of which LLM consumes it.

## Use it as a CI gate

`checklist_nacimiento` ends every evaluation with a machine block of stable keys (language-independent):

```json
{"tool":"checklist_nacimiento","aptos":17,"parciales":2,"faltas":0,"veredicto":"apto","puntos":[{"n":1,"estado":"ok"}]}
```

`veredicto` is `"apto"` (fit) only when `faltas` (missing points) is 0, so you can block merging agents that are not born compliant:

```bash
claude -p "Connect to el-buen-agente and run checklist_nacimiento on agents/my-agent.md with language: en. Reply ONLY with the JSON block." \
  | python3 -c "import json,sys; v=json.loads(sys.stdin.read())['veredicto']; exit(0 if v=='apto' else 1)"
```

## Development

```bash
npm install
npm start                         # http://localhost:3000/mcp
npm test                          # deterministic suite (18 tests), gates every deploy
npm run eval:golden -- --dry-run  # golden set mechanics, free
npm run eval:golden               # LLM eval vs expected verdicts (needs ANTHROPIC_API_KEY)
```

The source of truth is [`el_buen_agente.md`](el_buen_agente.md); the server parses it by section at startup. To change the criteria, edit that file.

**Stack:** Node 18+, Express, [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) (Streamable HTTP, stateless). Rate limit: 60 req/min per IP, 600 global.

**Privacy:** the server only logs the tool name and language of each call, never the content of evaluated definitions.

**Version history:** see [CHANGELOG.md](CHANGELOG.md).

## License

MIT
