(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const strip = $("#deck-strip");
  const hint = $("#deck-hint");
  let currentDoc = null;

  function buildDoc() {
    const doc = document.createElement("section");
    doc.className = "doc";
    doc.setAttribute("tabindex", "-1");
    doc.innerHTML = `
  <header class="doc-head">
    <div>
      <p class="doc-sub"></p>
      <h3 class="doc-title"></h3>
    </div>
    <div class="doc-actions">
      <button class="btn btn-danger" data-action="close">Close</button>
    </div>
  </header>
  <div class="doc-body">
    <div class="card"><h4>Selected Bullet</h4><p></p></div>
    <div class="card"><h4>Context</h4><p>TBD</p></div>
    <div class="card"><h4>Problem &amp; Hypothesis</h4><p>TBD</p></div>
    <div class="card"><h4>My Role</h4><p>TBD</p></div>
    <div class="card"><h4>Actions</h4><p>TBD</p></div>
    <div class="card"><h4>Results &amp; Metrics</h4><p>TBD</p></div>
    <div class="card"><h4>What I’d Do Next</h4><p>TBD</p></div>
    <div class="card"><h4>Artifacts / Links</h4><p>TBD</p></div>
  </div>
`;

    // actions
    doc.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      if (action === "close") {
        closeDoc();
      }
    });

    strip.appendChild(doc);
    currentDoc = doc;
    updateHint();
    return doc;
  }

  function closeDoc() {
    if (!currentDoc) return;
    currentDoc.remove();
    currentDoc = null;
    updateHint();
  }

  function updateDocContent(doc, { section, role, bullet }) {
    const sub = $(".doc-sub", doc);
    const title = $(".doc-title", doc);
    const cards = $$(".card p", doc);
    if (sub) sub.textContent = section || "";
    if (title) title.textContent = role || "";
    if (cards[0]) cards[0].textContent = bullet || "";
  }

  function updateHint() {
    hint.style.display = currentDoc ? "none" : "block";
  }

  function focusDoc(doc) {
    $$(".doc", strip).forEach((d) => d.classList.remove("focus"));
    if (!doc) return;
    doc.classList.add("focus");
    doc.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
    // ensure strip reveals the active doc
    strip.scrollLeft = 0;
    doc.focus({ preventScroll: true });
  }

  // Open new page for each bullet
  $$(".bullet").forEach((btn) => {
    btn.addEventListener("click", () => {
      const doc = currentDoc || buildDoc();
      updateDocContent(doc, {
        section: btn.getAttribute("data-section"),
        role: btn.getAttribute("data-role"),
        bullet: btn.getAttribute("data-text") || btn.textContent.trim(),
      });
      focusDoc(doc);
    });
  });

  // Keyboard shortcut: Esc closes the open deck
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDoc();
    }
  });
})();
