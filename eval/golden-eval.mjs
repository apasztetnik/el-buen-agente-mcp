#!/usr/bin/env node
// Evaluación LLM del golden set (capa 2 de golden/README.md).
// Levanta el servidor local, arma los briefs con las tools reales, se los da a
// un modelo y compara el veredicto con el esperado. Falla (exit 1) ante regresión.
//
// Uso:   npm run eval:golden
// Auth:  ANTHROPIC_API_KEY (o ANTHROPIC_AUTH_TOKEN / perfil de `ant auth login`)
// Modelo: EVAL_MODEL para override (default: claude-opus-4-8)

import Anthropic from "@anthropic-ai/sdk";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT = 3299;
const BASE = `http://localhost:${PORT}`;
const MODEL = process.env.EVAL_MODEL || "claude-opus-4-8";

const SEMAFORO_JSON =
  '\n\nAl final de tu evaluación agregá un bloque de código JSON (cercado con ```json) con EXACTAMENTE esta forma: {"semaforo":"verde"} usando "verde", "amarillo" o "rojo" según tu veredicto.';

const CASES = [
  {
    fixture: "facturabot-v1.md",
    tool: "checklist_nacimiento",
    esperado: "no_apto con faltas >= 15",
    check: (j) => j.veredicto === "no_apto" && j.faltas >= 15,
  },
  {
    fixture: "facturabot-v2.md",
    tool: "checklist_nacimiento",
    esperado: "apto con 0 faltas y aptos >= 16",
    check: (j) => j.veredicto === "apto" && j.faltas === 0 && j.aptos >= 16,
  },
  {
    fixture: "facturabot-v1.md",
    tool: "evaluar_autonomia",
    esperado: "semaforo rojo",
    extra: SEMAFORO_JSON,
    check: (j) => j.semaforo === "rojo",
  },
  {
    fixture: "facturabot-v2.md",
    tool: "evaluar_autonomia",
    esperado: "semaforo verde",
    extra: SEMAFORO_JSON,
    check: (j) => j.semaforo === "verde",
  },
];

const fixture = (name) =>
  readFileSync(join(ROOT, "golden", name), "utf-8").split("---\n")[1].trim();

async function startServer() {
  const proc = spawn("node", [join(ROOT, "server.js")], {
    env: { ...process.env, PORT: String(PORT), DISABLE_RATE_LIMIT: "1" },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return proc;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("el servidor no levantó");
}

let rpcId = 0;
async function callTool(name, args) {
  const res = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "tools/call", params: { name, arguments: args } }),
  });
  const line = (await res.text()).split("\n").find((l) => l.startsWith("data: "));
  return JSON.parse(line.slice(6)).result.content[0].text;
}

function lastJsonBlock(text) {
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (!blocks.length) throw new Error("la respuesta no incluye bloque json");
  return JSON.parse(blocks[blocks.length - 1][1]);
}

const DRY = process.argv.includes("--dry-run");
const proc = await startServer();
const client = DRY ? null : new Anthropic();
let fallos = 0;

console.log(`Golden eval: ${CASES.length} casos, modelo ${MODEL}\n`);

for (const c of CASES) {
  const brief = await callTool(c.tool, { agent_definition: fixture(c.fixture) });
  const prompt = `${brief}${c.extra ?? ""}\n\nEjecutá esta evaluación AHORA, vos mismo, siguiendo el formato pedido.`;

  if (DRY) {
    console.log(`🔎 [dry-run] ${c.fixture} × ${c.tool}: brief de ${prompt.length} chars, esperado: ${c.esperado}`);
    continue;
  }
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });
  const texto = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");

  let resultado, detalle;
  try {
    const j = lastJsonBlock(texto);
    resultado = c.check(j) ? "PASS" : "FAIL";
    detalle = JSON.stringify(j).slice(0, 120);
  } catch (e) {
    resultado = "ERROR";
    detalle = e.message;
  }
  if (resultado !== "PASS") fallos++;
  console.log(`${resultado === "PASS" ? "✅" : "❌"} ${c.fixture} × ${c.tool}`);
  console.log(`   esperado: ${c.esperado}`);
  console.log(`   obtenido: ${detalle}\n`);
}

proc.kill();
console.log(DRY ? "Dry-run OK: briefs armados, sin llamadas a la API" : fallos === 0 ? "Golden eval: todo verde ✅" : `Golden eval: ${fallos} regresión(es) ❌`);
process.exit(fallos === 0 ? 0 : 1);
