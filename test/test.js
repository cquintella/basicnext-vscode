// Author: Carlos Quintella
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

const assert = require("assert");
const fs = require("fs");
const Module = require("module");
const path = require("path");

const extension = path.resolve(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(extension, "package.json"), "utf8"));
assert.strictEqual(packageJson.version, "0.6.6");
assert.strictEqual(packageJson.contributes.grammars[0].path, "./syntaxes/basicnext.tmLanguage.json");
assert.strictEqual(packageJson.contributes.debuggers[0].type, "basicnext");
assert.deepStrictEqual(packageJson.contributes.debuggers[0].languages, ["basicnext"]);
assert.ok(packageJson.contributes.snippets);
assert.ok(packageJson.contributes.themes);
assert.ok(packageJson.contributes.configuration.properties["basicnext.blockColors.function"]);
assert.ok(packageJson.contributes.configuration.properties["basicnext.formatOnSave"]);
assert.ok(packageJson.contributes.configuration.properties["basicnext.checkOnSave"]);
assert.strictEqual(
  packageJson.contributes.configuration.properties["basicnext.keywordManualUrl"].default,
  "https://raw.githubusercontent.com/cquintella/basicnext-book/main/en/21_keywords.md",
);
assert.ok(packageJson.contributes.configurationDefaults["[basicnext]"]);
const originalLoad = Module._load;
const calls = [];
const childHandlers = {};
let saved;
let willSave;
const commands = {};
const terminalLines = [];
let activeEditor;
let saveCount = 0;
const configValues = {
  executable: "",
  autoUppercaseKeywords: true,
  autoUppercaseOnPaste: true,
  autoUppercaseExclusions: [],
  formatOnSave: false,
  runArgs: [],
  buildArgs: [],
  checkArgs: [],
  lspArgs: [],
  checkOnSave: true,
  checkOnType: false,
  checkDebounceMs: 500,
  diagnosticsMinimumSeverity: "warning",
  "blockColors.function": "#C586C0",
  "blockColors.while": "#D7BA7D",
  "blockColors.for": "#CE9178",
  "blockColors.repeat": "#DCDCAA",
  "blockColors.conditional": "#569CD6",
  "blockColors.class": "#4EC9B0",
  "blockColors.flow": "#F44747",
  "blockColors.await": "#B267E6",
};
Module._load = (request, parent, isMain) => {
  if (request === "vscode") {
    return {
      DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
      Range: class Range { constructor(...values) { this.values = values; } },
      Position: class Position { constructor(...values) { this.values = values; } },
      FoldingRange: class FoldingRange { constructor(start, end) { this.start = start; this.end = end; } },
      Hover: class Hover { constructor(contents) { this.contents = contents; } },
      MarkdownString: class MarkdownString { constructor(value) { this.value = value; } },
      TextEdit: { replace: (range, text) => ({ range, text }) },
      Diagnostic: class Diagnostic { constructor(range, message, severity) { Object.assign(this, { range, message, severity }); } },
      languages: {
        createDiagnosticCollection: () => ({ set: (...values) => calls.push(values) }),
        registerDefinitionProvider: () => ({ dispose() {} }),
        registerReferenceProvider: () => ({ dispose() {} }),
        registerHoverProvider: () => ({ dispose() {} }),
        registerDocumentSymbolProvider: () => ({ dispose() {} }),
        registerCompletionItemProvider: () => ({ dispose() {} }),
        registerDocumentFormattingEditProvider: () => ({ dispose() {} }),
        registerFoldingRangeProvider: () => ({ dispose() {} }),
      },
      CompletionItem: class CompletionItem { constructor(label, kind) { Object.assign(this, { label, kind }); } },
      StatusBarAlignment: { Left: 1, Right: 2 },
      ConfigurationTarget: { Global: 1, Workspace: 2 },
      workspace: {
        getConfiguration: (section) => ({
          get: (key, fallback) => {
            if (section === "basicnext") {
              return Object.prototype.hasOwnProperty.call(configValues, key)
                ? configValues[key]
                : fallback;
            }
            return fallback;
          },
          inspect: () => ({ workspaceValue: undefined, globalValue: undefined }),
          update: async () => {},
        }),
        getWorkspaceFolder: () => undefined,
        onDidOpenTextDocument: () => ({ dispose() {} }),
        onDidChangeTextDocument: () => ({ dispose() {} }),
        onDidCloseTextDocument: () => ({ dispose() {} }),
        onDidSaveTextDocument: (listener) => { saved = listener; return { dispose() {} }; },
        onWillSaveTextDocument: (listener) => { willSave = listener; return { dispose() {} }; },
        onDidChangeConfiguration: () => ({ dispose() {} }),
        onDidChangeWorkspaceFolders: () => ({ dispose() {} }),
        textDocuments: [],
        workspaceFolders: [],
      },
      window: {
        get activeTextEditor() { return activeEditor; },
        createTerminal: () => ({ show() {}, sendText: (line) => terminalLines.push(line) }),
        createStatusBarItem: () => ({
          show() {},
          dispose() {},
          text: "",
          tooltip: "",
          command: "",
        }),
        showQuickPick: async () => undefined,
      },
      commands: {
        registerCommand: (name, command) => { commands[name] = command; return { dispose() {} }; },
        executeCommand: async () => {},
      },
      Uri: { file: (p) => ({ toString: () => `file://${p}`, fsPath: p }), parse: (u) => ({ toString: () => u }) },
    };
  }
  if (request === "child_process") {
    return {
      spawn: () => ({
        stdin: { write() {} },
        stdout: { on() {} },
        on(event, listener) { childHandlers[event] = listener; },
        kill() {},
      }),
      execFile: (_file, _args, _opts, cb) => {
        if (typeof _opts === "function") cb = _opts;
        if (cb) setImmediate(() => cb(new Error("ENOENT"), "", ""));
      },
    };
  }
  return originalLoad(request, parent, isMain);
};
const { activate, parseDiagnostics, lspCompletionItems, formatBasicNextSource, diagnosticSeverityFromLsp, filterDiagnosticsBySeverity, parseKeywordManual, keywordPhraseAt, installKeywordManual, KEYWORD_MANUAL_FILE, KEYWORD_MANUAL_URL } = require(path.join(extension, "extension.js"));
assert.deepStrictEqual(
  lspCompletionItems([{ label: "PRINT", kind: 14, detail: "Basic Next keyword" }]).map((item) => item.label),
  ["PRINT"],
);
assert.deepStrictEqual(
  lspCompletionItems({ items: [{ label: "LET", kind: 14 }] }).map((item) => item.label),
  ["LET"],
);
assert.deepStrictEqual(lspCompletionItems(null), []);
Module._load = originalLoad;
const diagnostics = parseDiagnostics("error[E100]: first\n --> sample.bn:2:5\nerror[E200]: second\n --> sample.bn:4:1\n");
assert.strictEqual(diagnostics.length, 2);
assert.deepStrictEqual(diagnostics.map((diagnostic) => [diagnostic.message, diagnostic.range.values]), [["first", [1, 4, 1, 5]], ["second", [3, 0, 3, 1]]]);
assert.strictEqual(formatBasicNextSource("end   if"), "END IF");
assert.strictEqual(diagnosticSeverityFromLsp(1), 0);
assert.strictEqual(diagnosticSeverityFromLsp(2), 1);
assert.strictEqual(diagnosticSeverityFromLsp(3), 2);
assert.strictEqual(diagnosticSeverityFromLsp(4), 3);
assert.strictEqual(diagnosticSeverityFromLsp(undefined), 0);
assert.strictEqual(filterDiagnosticsBySeverity([{ severity: 0 }, { severity: 1 }, { severity: 2 }], "warning").length, 2);
assert.strictEqual(filterDiagnosticsBySeverity([{ severity: 0 }, { severity: 1 }, { severity: 2 }], "hint").length, 3);
const languageConfiguration = JSON.parse(fs.readFileSync(path.join(extension, "language-configuration.json"), "utf8"));
const increaseIndent = new RegExp(languageConfiguration.indentationRules.increaseIndentPattern);
assert.ok(increaseIndent.test("PUBLIC FUNCTION Calc() AS INTEGER"));
assert.ok(increaseIndent.test("EXPORT CLASS Box"));
assert.ok(increaseIndent.test("IF ready THEN"));
assert.ok(increaseIndent.test("IF ready THEN // stay"));
assert.ok(!increaseIndent.test("IF ready THEN PRINT 1"));
assert.ok(!increaseIndent.test("    IF ready THEN RETURN 1"));
activate({ subscriptions: { push() {} } });
assert.strictEqual(typeof saved, "function");
assert.strictEqual(typeof willSave, "function");
assert.strictEqual(typeof commands["basicnext.check"], "function");
assert.strictEqual(typeof commands["basicnext.statusBarAction"], "function");

(async () => {
  activeEditor = { document: {
    languageId: "basicnext",
    isUntitled: false,
    isDirty: true,
    fileName: "/tmp/example.bn",
    uri: { toString: () => "file:///tmp/example.bn", fsPath: "/tmp/example.bn" },
    save: async () => { saveCount += 1; return true; },
  } };
  await commands["basicnext.run"]();
  await commands["basicnext.buildAndRun"]();
  assert.strictEqual(saveCount, 2);
  assert.match(terminalLines[0], /'bni' run '\/tmp\/example\.bn'/);
  assert.match(terminalLines[1], /'bnc' '\/tmp\/example\.bn' -o .* && /);

  configValues.runArgs = ["--trace"];
  terminalLines.length = 0;
  await commands["basicnext.run"]();
  assert.match(terminalLines[0], /'bni' run '--trace' '\/tmp\/example\.bn'/);

  const savedDocument = activeEditor.document;
  await saved(savedDocument);
  await new Promise((resolve) => setImmediate(resolve));
  assert.strictEqual(calls.length, 0);
  childHandlers.error();
  await saved(savedDocument);
  await new Promise((resolve) => setImmediate(resolve));
  assert.strictEqual(calls.length, 1);

  const manual = [
    "### END",
    "",
    "Only the first word of a closer.",
    "",
    "### END FUNCTION",
    "",
    "Closes a function.",
    "",
    "### FUNCTION",
    "",
    "Declares a function.",
    "",
    "## Diagnostics",
    "",
    "Later.",
  ].join("\n");
  const entries = parseKeywordManual(manual);
  assert.ok(entries.get("END FUNCTION").includes("Closes a function."));
  assert.ok(!entries.get("END FUNCTION").includes("Later"));
  const source = "END FUNCTION\nFUNCTION Start\n";
  assert.ok(keywordPhraseAt(source, 0, entries).includes("Closes a function."));
  assert.ok(keywordPhraseAt(source, 4, entries).includes("Closes a function."));
  assert.ok(keywordPhraseAt(source, source.indexOf("FUNCTION Start"), entries).includes("Declares a function."));

  const os = require("os");
  const { EventEmitter } = require("events");
  const storage = fs.mkdtempSync(path.join(os.tmpdir(), "bn-keyword-manual-"));
  const versions = {};
  let downloads = 0;
  const respond = (status, body) => (url, _options, callback) => {
    downloads += 1;
    assert.strictEqual(url, KEYWORD_MANUAL_URL);
    const response = new EventEmitter();
    response.statusCode = status;
    response.headers = {};
    response.resume = () => {};
    process.nextTick(() => {
      callback(response);
      if (body !== undefined) response.emit("data", Buffer.from(body));
      response.emit("end");
    });
    return { on() {}, destroy() {} };
  };
  const context = {
    globalStorageUri: { fsPath: storage },
    globalState: {
      get: (key) => versions[key],
      update: async (key, value) => { versions[key] = value; },
    },
  };
  const savedManual = await installKeywordManual(context, {
    get: respond(200, manual),
    url: KEYWORD_MANUAL_URL,
    version: "0.6.5",
  });
  assert.strictEqual(savedManual, path.join(storage, KEYWORD_MANUAL_FILE));
  assert.strictEqual(downloads, 1);
  assert.ok(fs.readFileSync(savedManual, "utf8").includes("### END FUNCTION"));
  const cached = await installKeywordManual(context, {
    get: respond(200, manual),
    url: KEYWORD_MANUAL_URL,
    version: "0.6.5",
  });
  assert.strictEqual(cached, savedManual);
  assert.strictEqual(downloads, 1);

  const rejected = fs.mkdtempSync(path.join(os.tmpdir(), "bn-keyword-manual-"));
  const missing = await installKeywordManual({
    globalStorageUri: { fsPath: rejected },
    globalState: { get: () => undefined, update: async () => {} },
  }, {
    get: respond(404),
    url: KEYWORD_MANUAL_URL,
    version: "0.6.5",
  });
  assert.strictEqual(missing, null);
  assert.ok(!fs.existsSync(path.join(rejected, KEYWORD_MANUAL_FILE)));
  fs.rmSync(storage, { recursive: true, force: true });
  fs.rmSync(rejected, { recursive: true, force: true });

  console.log("Basic Next VS Code extension checks passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
