// Writes the tokens that vscode-textmate produces for a source file, as the
// expected output for augite's highlighting tests.
//
// Usage: node tokens.mjs <grammar.tmLanguage.json> <source> [<grammar>...] > <fixture.json>
//
// The grammars after the source are the ones the first grammar can include.
//
// The fixture is a JSON object. "scopes" is an array of the distinct scope
// lists, each the scope names of a token, outermost first, separated by
// spaces. "lines" has one element for each line of the source: an array of
// [start, end, scopes] tokens, where start and end are byte offsets into the
// line, without its newline, and scopes is an index into "scopes". Adjacent
// tokens with the same scopes are joined, as augite's tests join them.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import oniguruma from "vscode-oniguruma";
import textmate from "vscode-textmate";

const [grammarPath, sourcePath, ...otherPaths] = process.argv.slice(2);
if (!grammarPath || !sourcePath) {
  console.error("usage: node tokens.mjs <grammar.tmLanguage.json> <source> [<grammar>...]");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const wasm = readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm"));
await oniguruma.loadWASM(wasm.buffer);

const grammars = new Map();
for (const path of [grammarPath, ...otherPaths]) {
  const text = readFileSync(path, "utf8");
  grammars.set(JSON.parse(text).scopeName, { text, path });
}
const scopeName = JSON.parse(readFileSync(grammarPath, "utf8")).scopeName;
const registry = new textmate.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (sources) => new oniguruma.OnigScanner(sources),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }),
  loadGrammar: async (name) => {
    const g = grammars.get(name);
    return g ? textmate.parseRawGrammar(g.text, g.path) : null;
  },
});
const grammar = await registry.loadGrammar(scopeName);

const bytes = (s) => Buffer.byteLength(s, "utf8");

const lines = readFileSync(sourcePath, "utf8").split("\n");
if (lines[lines.length - 1] === "") lines.pop();

const scopeLists = [];
const scopeIndex = new Map();
const indexOf = (scopes) => {
  if (!scopeIndex.has(scopes)) {
    scopeIndex.set(scopes, scopeLists.length);
    scopeLists.push(scopes);
  }
  return scopeIndex.get(scopes);
};

let stack = textmate.INITIAL;
const out = lines.map((line) => {
  const result = grammar.tokenizeLine(line, stack);
  stack = result.ruleStack;
  const tokens = [];
  for (const t of result.tokens) {
    const end = Math.min(t.endIndex, line.length);
    if (t.startIndex >= end) continue;
    const start = bytes(line.slice(0, t.startIndex));
    const stop = start + bytes(line.slice(t.startIndex, end));
    const scopes = indexOf(t.scopes.join(" "));
    const prev = tokens[tokens.length - 1];
    if (prev && prev[1] === start && prev[2] === scopes) {
      prev[1] = stop;
    } else {
      tokens.push([start, stop, scopes]);
    }
  }
  return tokens;
});

process.stdout.write(
  '{"scopes": [\n' +
    scopeLists.map((s) => JSON.stringify(s)).join(",\n") +
    '\n],\n"lines": [\n' +
    out.map((t) => JSON.stringify(t)).join(",\n") +
    "\n]}\n"
);
