// augite.js adds a file tree and a filter to the files page, and the
// selection of a range of lines to file pages. Every page works without it.
(function () {
  "use strict";

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

  var files = document.getElementById("files");
  if (files) setUpFiles(files);
  var blob = document.getElementById("blob");
  if (blob) setUpBlob(blob);
})();
