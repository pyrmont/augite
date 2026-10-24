// augite.js adds a button to copy the clone command, a file tree and a filter
// to the files page, and the selection of a range of lines to file pages.
// Every page works without it.
(function () {
  "use strict";

  // Clone command

  var svgNS = "http://www.w3.org/2000/svg";

  // Returns an SVG glyph drawn from the path data in paths.
  function glyph(paths) {
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("aria-hidden", "true");
    paths.forEach(function (d) {
      var path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  var copyPaths = ["M5.5 5.5h8v8h-8z", "M10.5 3V2.5h-8v8H3"];
  var donePaths = ["M3 8.5l3 3 7-7"];

  // Copies text to the clipboard. The clipboard API is available only in a
  // secure context, so elsewhere the text is copied from a hidden field.
  function copyText(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text);
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var copied = document.execCommand("copy");
    document.body.removeChild(field);
    return copied ? Promise.resolve() : Promise.reject();
  }

  function setUpClone(p) {
    var command = p.querySelector(".command").textContent.trim();
    var button = document.createElement("button");
    button.type = "button";
    button.className = "copy";
    button.title = "Copy";
    button.setAttribute("aria-label", "Copy clone command");
    button.appendChild(glyph(copyPaths));
    var timer = null;
    button.addEventListener("click", function () {
      copyText(command).then(function () {
        button.replaceChild(glyph(donePaths), button.firstChild);
        button.title = "Copied";
        clearTimeout(timer);
        timer = setTimeout(function () {
          button.replaceChild(glyph(copyPaths), button.firstChild);
          button.title = "Copy";
        }, 1500);
      });
    });
    p.appendChild(button);
  }

  // Files page

  function buildTree(rows) {
    var root = { dirs: {}, files: [] };
    rows.forEach(function (row) {
      var parts = row.getAttribute("data-path").split("/");
      var node = root;
      for (var i = 0; i < parts.length - 1; i++) {
        var name = parts[i];
        if (!node.dirs[name]) node.dirs[name] = { dirs: {}, files: [] };
        node = node.dirs[name];
      }
      node.files.push({ name: parts[parts.length - 1], row: row });
    });
    return root;
  }

  function renderNode(node) {
    var ul = document.createElement("ul");
    Object.keys(node.dirs).sort().forEach(function (name) {
      var li = document.createElement("li");
      var details = document.createElement("details");
      var summary = document.createElement("summary");
      summary.textContent = name + "/";
      details.appendChild(summary);
      details.appendChild(renderNode(node.dirs[name]));
      li.appendChild(details);
      ul.appendChild(li);
    });
    node.files.forEach(function (file) {
      var li = document.createElement("li");
      var cell = file.row.querySelector(".name");
      var link = cell.querySelector("a");
      if (link) {
        var a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = file.name;
        li.appendChild(a);
      } else {
        li.appendChild(document.createTextNode(file.name));
      }
      // A submodule's cell ends with " @ <hash>".
      var at = cell.textContent.lastIndexOf(" @ ");
      if (at !== -1) li.appendChild(document.createTextNode(cell.textContent.slice(at)));
      var size = file.row.querySelector(".size").textContent;
      if (size) {
        var span = document.createElement("span");
        span.className = "size";
        span.textContent = " " + size;
        li.appendChild(span);
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function setUpFiles(table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-path]"));
    if (rows.length === 0) return;

    var filter = document.createElement("div");
    filter.className = "filter";
    var input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Filter files";
    input.setAttribute("aria-label", "Filter files");
    filter.appendChild(input);

    var tree = renderNode(buildTree(rows));
    tree.className = "tree";

    table.parentNode.insertBefore(filter, table);
    table.parentNode.insertBefore(tree, table);
    table.hidden = true;

    // With a query, the matching rows of the table are shown instead of the tree.
    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();
      tree.hidden = query !== "";
      table.hidden = query === "";
      rows.forEach(function (row) {
        row.hidden = query !== "" &&
          row.getAttribute("data-path").toLowerCase().indexOf(query) === -1;
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && document.activeElement !== input &&
          !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        input.focus();
      }
    });
  }

  // File pages

  // Matches #l10 and the ranges #l10-l20 and #l10-20.
  var linePattern = /^#l(\d+)(?:-l?(\d+))?$/;

  function parseLines(hash) {
    var match = linePattern.exec(hash);
    if (!match) return null;
    var first = parseInt(match[1], 10);
    var last = match[2] ? parseInt(match[2], 10) : first;
    return { first: Math.min(first, last), last: Math.max(first, last) };
  }

  function setUpBlob(blob) {
    var selected = [];

    function select() {
      selected.forEach(function (line) { line.classList.remove("selected"); });
      selected = [];
      var range = parseLines(window.location.hash);
      if (!range || range.first === range.last) return;
      for (var n = range.first; n <= range.last; n++) {
        var line = document.getElementById("l" + n);
        if (!line) break;
        line.classList.add("selected");
        selected.push(line);
      }
      if (selected.length > 0) selected[0].scrollIntoView({ block: "center" });
    }

    // A shift-click on a line number extends the selection to that line.
    blob.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a.n") : null;
      if (!link || !event.shiftKey) return;
      var range = parseLines(window.location.hash);
      if (!range) return;
      event.preventDefault();
      var n = parseInt(link.parentNode.id.slice(1), 10);
      window.location.hash = "#l" + Math.min(range.first, n) + "-l" + Math.max(range.first, n);
    });

    window.addEventListener("hashchange", select);
    select();
  }

  var clone = document.querySelector("header .url");
  if (clone) setUpClone(clone);
  var files = document.getElementById("files");
  if (files) setUpFiles(files);
  var blob = document.getElementById("blob");
  if (blob) setUpBlob(blob);
})();
