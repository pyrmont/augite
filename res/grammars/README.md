# Grammars

TextMate grammars for `augite repo -g`. Copy this directory to the server and
pass its path with `-g`. A file is highlighted with the first grammar, in
order of file name, whose `fileTypes` includes the file's name or extension.

| File | Source | Licence |
|---|---|---|
| `Swift.tmLanguage.json` | [jtbandes/swift-tmlanguage](https://github.com/jtbandes/swift-tmlanguage) | MIT (`Swift.LICENSE.md`) |
| `HTML.tmLanguage.json` | VS Code `extensions/html` at 4532436 | MIT (`VSCode.LICENSE.txt`) |
| `JavaScript.tmLanguage.json` | VS Code `extensions/javascript` at 2105419 | MIT (`VSCode.LICENSE.txt`) |
| `JSON.tmLanguage.json` | VS Code `extensions/json` at d6af489 | MIT (`VSCode.LICENSE.txt`) |
| `Shell.tmLanguage.json` | VS Code `extensions/shellscript` at 9473445 | MIT (`VSCode.LICENSE.txt`) |
| `XML.tmLanguage.json` | VS Code `extensions/xml` at 10a1d2a | MIT (`VSCode.LICENSE.txt`) |
| `TOML.tmLanguage.json` | [textmate/toml.tmbundle](https://github.com/textmate/toml.tmbundle) at e82b64c | TextMate bundle licence (below) |
| `YAML.tmLanguage.json` | [textmate/yaml.tmbundle](https://github.com/textmate/yaml.tmbundle) at e54ceae | TextMate bundle licence (below) |

All but Swift are the JSON versions in Shiki's
[tm-grammars](https://github.com/shikijs/textmate-grammars-themes) package.
VS Code keeps the file types of a grammar in its extension's `package.json`,
so `fileTypes` was added to the HTML, JavaScript, JSON, Shell and XML
grammars.

HTML includes `source.js` for `<script>` and `source.css` for `<style>`. There
is no CSS grammar here, so styles are not highlighted. HTML's injection, which
marks a stray `<` as invalid, is not supported.

The TextMate bundle licence:

> Permission to copy, use, modify, sell and distribute this software is
> granted. This software is provided "as is" without express or implied
> warranty, and with no claim as to its suitability for any purpose.
