import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3211;
const BASE = `http://localhost:${PORT}`;
let proc;

before(async () => {
  proc = spawn("node", [join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORT), DISABLE_RATE_LIMIT: "1" },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("el servidor no levantó");
});

after(() => proc.kill());

let rpcId = 0;
async function rpc(method, params) {
  const res = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  const body = await res.text();
  const line = body.split("\n").find((l) => l.startsWith("data: "));
  const msg = JSON.parse(line.slice(6));
  if (msg.error) throw new Error(`RPC error: ${JSON.stringify(msg.error)}`);
  return msg.result;
}
const callTool = async (name, args = {}) => (await rpc("tools/call", { name, arguments: args })).content[0].text;

// Lee un fixture golden quitando el encabezado de veredicto esperado
const fixture = (name) => readFileSync(join(__dirname, "..", "golden", name), "utf-8").split("---\n")[1].trim();

const EXPECTED_TOOLS = [
  "recomendar_flujo", "get_el_buen_agente", "evaluar_necesidad",
  "revisar_rol_y_frontera", "revisar_outputs", "evaluar_autonomia",
  "revisar_frontera_ejecucion", "aplicar_challenger", "auditar_contexto",
  "challenger_decision", "disenar_evaluacion", "generar_contrato",
  "evaluar_sistema", "plan_exposicion_mcp", "checklist_nacimiento",
  "construir_agente", "plan_de_inicio",
];

test("initialize: instructions de flujo + serverInfo", async () => {
  const r = await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0" },
  });
  assert.equal(r.serverInfo.name, "el-buen-agente");
  assert.ok(r.instructions.includes("EN ORDEN"), "instructions deben recomendar el orden");
  assert.ok(r.instructions.includes("recomendar_flujo"));
  assert.ok(r.instructions.includes("EN: This server"), "instructions deben tener resumen en inglés");
});

test("tools/list: las 17 tools exactas", async () => {
  const names = (await rpc("tools/list", {})).tools.map((t) => t.name).sort();
  assert.deepEqual(names, [...EXPECTED_TOOLS].sort());
});

test("resource: la guía completa, intacta", async () => {
  const r = await rpc("resources/read", { uri: "guide://el-buen-agente" });
  const guide = readFileSync(join(__dirname, "..", "el_buen_agente.md"), "utf-8");
  assert.equal(r.contents[0].text, guide);
});

test("evaluar_necesidad: embebe el problema + criterios §0 + hint", async () => {
  const t = await callTool("evaluar_necesidad", { problema: "PROBLEMA_MARCADOR_XYZ" });
  assert.ok(t.includes("PROBLEMA_MARCADOR_XYZ"), "debe embeber el input");
  assert.ok(t.includes("¿de verdad hace falta un agente?"), "criterios de §0");
  assert.ok(t.includes("Antipatrones"), "tabla de antipatrones de §0");
  assert.ok(t.includes("Siguiente paso recomendado"), "hint de flujo");
  assert.ok(t.includes("revisar_rol_y_frontera"), "siguiente tool correcta");
});

test("checklist_nacimiento: los 19 puntos + gate + hint a construir_agente", async () => {
  const t = await callTool("checklist_nacimiento", { agent_definition: "agente de prueba" });
  for (const punto of ["1. Rol + frontera", "10. Sanitización", "19. Monitoreo"]) {
    assert.ok(t.includes(punto), `falta el punto: ${punto}`);
  }
  assert.ok(t.includes("Sé estricto"), "instrucción de evaluación estricta");
  assert.ok(t.includes("construir_agente"), "hint debe apuntar a construir_agente si APTO");
});

test("language en: agrega instrucción de idioma; es (default): no", async () => {
  const en = await callTool("checklist_nacimiento", { agent_definition: "x", language: "en" });
  assert.ok(en.includes("Write your ENTIRE evaluation in English"));
  const es = await callTool("checklist_nacimiento", { agent_definition: "x" });
  assert.ok(!es.includes("Response language"));
});

test("generar_contrato ES: determinístico, pendientes bloquean", async () => {
  const t = await callTool("generar_contrato", { nombre: "bot-test", problema: "resuelve X" });
  assert.ok(t.includes("AGENTE: bot-test"));
  assert.ok(t.includes("PROBLEMA: resuelve X"));
  assert.ok(t.includes("INPUTS: [PENDIENTE]"));
  assert.ok(t.includes("⚠️ Campos pendientes:"));
  assert.ok(t.includes("no habilita el merge"));
});

test("generar_contrato EN: labels traducidos + contrato completo en verde", async () => {
  const full = {
    nombre: "bot", problema: "p", inputs: "i", output: "o", puede: "c",
    no_puede: "n", coste: "$", evaluacion: "e", autonomia: "a", language: "en",
  };
  const t = await callTool("generar_contrato", full);
  assert.ok(t.includes("AGENT: bot"));
  assert.ok(t.includes("CANNOT: n"));
  assert.ok(t.includes("✅ Contract complete"));
  assert.ok(!t.includes("[TBD]"), "contrato completo no debe tener TBD");
});

test("construir_agente: formato claude_skill + contrato embebido + hint a plan_de_inicio", async () => {
  const t = await callTool("construir_agente", {
    definicion_final: "DEF_MARCADOR",
    contrato: "CONTRATO_MARCADOR",
    formato: "claude_skill",
  });
  assert.ok(t.includes("SKILL.md"), "formato claude_skill");
  assert.ok(t.includes("DEF_MARCADOR"));
  assert.ok(t.includes("CONTRATO_MARCADOR"), "contrato embebido tal cual");
  assert.ok(t.includes("plan_de_inicio"), "hint de cierre");
  assert.ok(t.includes("NO evalúes — construí"));
});

test("recomendar_flujo: nuevo arranca en necesidad, existente en checklist", async () => {
  const nuevo = await callTool("recomendar_flujo", { situacion: "nuevo" });
  assert.ok(nuevo.indexOf("evaluar_necesidad") < nuevo.indexOf("checklist_nacimiento"));
  assert.ok(nuevo.includes("construir_agente"), "el flujo nuevo incluye la construcción");
  const exist = await callTool("recomendar_flujo", { situacion: "existente" });
  assert.ok(exist.includes("diagnóstico"));
  assert.ok(exist.indexOf("checklist_nacimiento") < exist.indexOf("revisar_rol_y_frontera"));
});

test("golden fixtures: se embeben completos en el brief del checklist", async () => {
  for (const f of ["facturabot-v1.md", "facturabot-v2.md"]) {
    const def = fixture(f);
    const t = await callTool("checklist_nacimiento", { agent_definition: def });
    assert.ok(t.includes(def), `${f} debe embeberse sin truncar`);
  }
});

test("checklist: contrato JSON para CI con claves estables", async () => {
  const t = await callTool("checklist_nacimiento", { agent_definition: "x" });
  assert.ok(t.includes("Bloque máquina (para CI)"), "instrucción del bloque máquina");
  assert.ok(t.includes('"veredicto":"apto"'), "schema de ejemplo presente");
  assert.ok(t.includes("sin traducir"), "claves estables independientes del idioma");
  // el contrato también debe estar cuando la evaluación es en inglés
  const en = await callTool("checklist_nacimiento", { agent_definition: "x", language: "en" });
  assert.ok(en.includes("Bloque máquina (para CI)"));
});

test("landing en / es HTML y /health responde JSON", async () => {
  const html = await (await fetch(`${BASE}/`)).text();
  assert.ok(html.includes("<!doctype html>"));
  assert.ok(html.includes("El Buen Agente"));
  assert.ok(html.includes("claude mcp add"));
  const health = await (await fetch(`${BASE}/health`)).json();
  assert.equal(health.status, "ok");
  assert.equal(health.endpoint, "/mcp");
});

test("todas las tools de evaluación responden con su sección correcta", async () => {
  const secciones = [
    ["revisar_rol_y_frontera", "§1"], ["revisar_outputs", "§2"],
    ["evaluar_autonomia", "§3"], ["revisar_frontera_ejecucion", "§4"],
    ["aplicar_challenger", "§5"], ["auditar_contexto", "§6"],
    ["disenar_evaluacion", "§7"], ["evaluar_sistema", "§9"],
    ["plan_exposicion_mcp", "§10"],
  ];
  for (const [tool, seccion] of secciones) {
    const t = await callTool(tool, { agent_definition: "x" });
    assert.ok(t.includes(`Revisión ${seccion}`), `${tool} debe usar criterios de ${seccion}`);
  }
});
