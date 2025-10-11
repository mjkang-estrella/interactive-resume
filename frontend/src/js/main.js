(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const page = $(".page");
  const deck = $("#deck");
  const doc = $("#deck-doc");
  const docContent = $("#doc-content");
  const paper = $("#paper");
  if (!page || !deck || !doc || !paper || !docContent) return;

  const sub = $(".doc-sub", doc);
  const title = $(".doc-title", doc);
  const closeBtn = $(".doc-close", doc);
  const toast = $("#tip-toast");
  const templateCache = new Map();
  const TEMPLATE_DIR = "pages/doc-pages";
  let activeTemplate = null;
  let motionQuery = null;
  let prefersReducedMotion = false;

  function applyPageMotionPreference() {
    if (prefersReducedMotion) {
      page.classList.add("page--no-motion");
    } else {
      page.classList.remove("page--no-motion");
    }
  }

  if (window.matchMedia) {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion = motionQuery.matches;
    applyPageMotionPreference();
    const motionListener = (event) => {
      prefersReducedMotion = event.matches;
      applyPageMotionPreference();
    };
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", motionListener);
    } else if (typeof motionQuery.addListener === "function") {
      motionQuery.addListener(motionListener);
    }
  } else {
    applyPageMotionPreference();
  }

  const canAnimateDeck =
    typeof deck.animate === "function" && typeof doc.animate === "function";
  let deckAnimationInstance = null;
  let docAnimationInstance = null;
  let deckAnimationState = deck.hidden ? "closed" : "open";
  let docContentSwapAnimation = null;

  const deckEnterKeyframes = [
    { opacity: 0, transform: "translateX(36px)" },
    { opacity: 1, transform: "translateX(0)" },
  ];
  const deckLeaveKeyframes = [
    { opacity: 1, transform: "translateX(0)" },
    { opacity: 0, transform: "translateX(40px)" },
  ];

  const deckEnterTiming = {
    duration: 340,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
  };
  const deckLeaveTiming = {
    duration: 260,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "forwards",
  };

  const paperEnterTiming = {
    duration: 340,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "both",
  };
  const paperLeaveTiming = {
    duration: 260,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "none",
  };

  const docEnterKeyframes = [
    { opacity: 0, transform: "translateX(18px) scale(0.98)" },
    { opacity: 1, transform: "translateX(0) scale(1)" },
  ];
  const docLeaveKeyframes = [
    { opacity: 1, transform: "translateX(0) scale(1)" },
    { opacity: 0, transform: "translateX(12px) scale(0.97)" },
  ];

  const docSwapOutKeyframes = [
    { opacity: 1, transform: "translateY(0)" },
    { opacity: 0, transform: "translateY(8px)" },
  ];
  const docSwapInKeyframes = [
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "translateY(0)" },
  ];

  const docEnterTiming = {
    duration: 360,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
    delay: 40,
  };
  const docLeaveTiming = {
    duration: 260,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "forwards",
  };
  const docSwapOutTiming = {
    duration: 150,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "forwards",
  };
  const docSwapInTiming = {
    duration: 220,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
    delay: 30,
  };

  function cleanupDocAnimation() {
    if (docAnimationInstance) {
      docAnimationInstance.cancel();
      docAnimationInstance = null;
    }
  }

  function cleanupDeckAnimation() {
    if (deckAnimationInstance) {
      deckAnimationInstance.cancel();
      deckAnimationInstance = null;
    }
  }

  function cleanupDocContentAnimation() {
    if (docContentSwapAnimation) {
      docContentSwapAnimation.cancel();
      docContentSwapAnimation = null;
    }
  }

  function resetDeckPositioning() {
    deck.style.removeProperty("position");
    deck.style.removeProperty("top");
    deck.style.removeProperty("left");
    deck.style.removeProperty("width");
    deck.style.removeProperty("height");
    deck.style.removeProperty("pointer-events");
    deck.style.removeProperty("z-index");
    page.classList.remove("deck-measuring-hide");
  }

  function canAnimate() {
    return !prefersReducedMotion && canAnimateDeck;
  }

  async function animateDocSwap(callback) {
    if (
      !callback ||
      !canAnimate() ||
      deckAnimationState !== "open" ||
      typeof docContent.animate !== "function"
    ) {
      cleanupDocContentAnimation();
      await callback();
      return;
    }

    cleanupDocContentAnimation();
    const outbound = docContent.animate(docSwapOutKeyframes, docSwapOutTiming);
    docContentSwapAnimation = outbound;
    try {
      await outbound.finished;
    } catch {
      if (docContentSwapAnimation !== outbound) {
        return;
      }
    }

    if (docContentSwapAnimation !== outbound) {
      return;
    }

    let callbackError;
    try {
      await callback();
    } catch (error) {
      callbackError = error;
    }

    const inbound = docContent.animate(docSwapInKeyframes, docSwapInTiming);
    docContentSwapAnimation = inbound;
    try {
      await inbound.finished;
    } catch {
      /* ignore */
    } finally {
      if (docContentSwapAnimation === inbound) {
        docContentSwapAnimation = null;
      }
    }

    if (callbackError) {
      throw callbackError;
    }
  }

  function triggerIntroHighlight() {
    const introBullet = $(".bullet--intro");
    if (introBullet) {
      introBullet.classList.add("pulsing");
      setTimeout(() => {
        introBullet.classList.remove("pulsing");
      }, 3000);
    }
  }

  if (toast) {
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      triggerIntroHighlight();
    }, 3000);
  } else {
    triggerIntroHighlight();
  }

  let lastTrigger = null;

  function showDeck() {
    const wasClosed =
      deck.hidden ||
      page.classList.contains("deck-hidden") ||
      deckAnimationState === "closing" ||
      deckAnimationState === "closed";

    cleanupDeckAnimation();
    cleanupDocAnimation();
    cleanupDocContentAnimation();
    resetDeckPositioning();

    if (!wasClosed) {
      deckAnimationState = "open";
      deck.hidden = false;
      page.classList.remove("deck-hidden");
      return;
    }

    const shouldAnimate = canAnimate();
    let paperDeltaX = 0;
    let paperAnimation = null;

    let paperFirstRect = null;
    if (shouldAnimate) {
      paperFirstRect = paper.getBoundingClientRect();
    }

    deck.hidden = false;
    page.classList.remove("deck-hidden");

    if (!shouldAnimate) {
      deckAnimationState = "open";
      return;
    }

    const paperLastRect = paper.getBoundingClientRect();
    paperDeltaX = paperFirstRect.left - paperLastRect.left;

    deckAnimationState = "opening";

    if (paperDeltaX !== 0) {
      paperAnimation = paper.animate(
        [
          { transform: `translateX(${paperDeltaX}px)` },
          { transform: "translateX(0)" },
        ],
        paperEnterTiming,
      );
      const cleanupPaper = () => {
        paperAnimation = null;
      };
      paperAnimation.addEventListener("finish", cleanupPaper);
      paperAnimation.addEventListener("cancel", cleanupPaper);
    }

    deckAnimationInstance = deck.animate(deckEnterKeyframes, deckEnterTiming);
    docAnimationInstance = doc.animate(docEnterKeyframes, docEnterTiming);

    deckAnimationInstance.addEventListener("finish", () => {
      deckAnimationInstance = null;
      deckAnimationState = "open";
    });
    deckAnimationInstance.addEventListener("cancel", () => {
      deckAnimationInstance = null;
    });

    const docCleanup = () => {
      docAnimationInstance = null;
    };
    docAnimationInstance.addEventListener("finish", docCleanup);
    docAnimationInstance.addEventListener("cancel", docCleanup);
  }

  function hideDeck() {
    if (
      deck.hidden ||
      deckAnimationState === "closed" ||
      deckAnimationState === "closing"
    ) {
      return Promise.resolve(deckAnimationState === "closed");
    }

    cleanupDeckAnimation();
    cleanupDocAnimation();
    cleanupDocContentAnimation();

    const shouldAnimate = canAnimate();

    if (!shouldAnimate) {
      resetDeckPositioning();
      deck.hidden = true;
      page.classList.add("deck-hidden");
      deckAnimationState = "closed";
      doc.classList.remove("focus");
      return Promise.resolve(true);
    }

    const paperFirstRect = paper.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    const deckRect = deck.getBoundingClientRect();

    page.classList.add("deck-measuring-hide");
    deck.style.position = "absolute";
    deck.style.left = `${deckRect.left - pageRect.left}px`;
    deck.style.top = `${deckRect.top - pageRect.top}px`;
    deck.style.width = `${deckRect.width}px`;
    deck.style.height = `${deckRect.height}px`;
    deck.style.pointerEvents = "none";
    deck.style.zIndex = "2";

    const paperLastRect = paper.getBoundingClientRect();
    const deltaX = paperFirstRect.left - paperLastRect.left;

    deckAnimationState = "closing";
    doc.classList.remove("focus");

    let paperAnimation = null;
    if (deltaX !== 0) {
      paperAnimation = paper.animate(
        [
          { transform: `translateX(${deltaX}px)` },
          { transform: "translateX(0)" },
        ],
        paperLeaveTiming,
      );
    }

    deckAnimationInstance = deck.animate(deckLeaveKeyframes, deckLeaveTiming);
    docAnimationInstance = doc.animate(docLeaveKeyframes, docLeaveTiming);

    const finishPromise = new Promise((resolve) => {
      const finalize = () => {
        resetDeckPositioning();
        deck.hidden = true;
        page.classList.add("deck-hidden");
        deckAnimationState = "closed";
        deckAnimationInstance = null;
        doc.classList.remove("focus");
        resolve(true);
      };

      deckAnimationInstance.addEventListener("finish", finalize);
      deckAnimationInstance.addEventListener("cancel", () => {
        deckAnimationInstance = null;
        const isClosed = deck.hidden || page.classList.contains("deck-hidden");
        resetDeckPositioning();
        deckAnimationState = isClosed ? "closed" : "open";
        if (isClosed) {
          doc.classList.remove("focus");
        }
        resolve(isClosed);
      });

      const docCleanup = () => {
        docAnimationInstance = null;
      };
      docAnimationInstance.addEventListener("finish", docCleanup);
      docAnimationInstance.addEventListener("cancel", docCleanup);

      if (paperAnimation) {
        const cleanupPaper = () => {
          paperAnimation = null;
          paperAnimation.removeEventListener("finish", cleanupPaper);
          paperAnimation.removeEventListener("cancel", cleanupPaper);
        };
        paperAnimation.addEventListener("finish", cleanupPaper);
        paperAnimation.addEventListener("cancel", cleanupPaper);
      }
    });

    return finishPromise;
  }

  function normalizeTemplateName(name) {
    if (!name) return "default";
    const cleaned = name.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    return cleaned || "default";
  }

  async function loadTemplate(requested) {
    const templateName = normalizeTemplateName(requested);
    if (
      activeTemplate === templateName &&
      docContent.dataset.template === templateName
    ) {
      return templateName;
    }

    if (!templateCache.has(templateName)) {
      const response = await fetch(`${TEMPLATE_DIR}/${templateName}.html`);
      if (!response.ok) {
        throw new Error(`Unable to load template: ${templateName}`);
      }
      const markup = await response.text();
      templateCache.set(templateName, markup);
    }

    docContent.innerHTML = templateCache.get(templateName);
    docContent.dataset.template = templateName;
    activeTemplate = templateName;
    return templateName;
  }

  function applyDocData({ section, roleTitle, bulletText, url }) {
    const sectionSlot = docContent.querySelector("[data-slot='section']");
    if (sectionSlot) sectionSlot.textContent = section || "";

    const sectionLabelSlot = docContent.querySelector(
      "[data-slot='section-label']",
    );
    if (sectionLabelSlot) {
      sectionLabelSlot.textContent = section || "Highlight";
    }

    const roleSlot = docContent.querySelector("[data-slot='role']");
    if (roleSlot) roleSlot.textContent = roleTitle || "Role";

    const bulletSlot = docContent.querySelector("[data-slot='bullet']");
    if (bulletSlot) {
      if (bulletText != null) {
        bulletSlot.textContent = bulletText;
      } else if (!bulletSlot.textContent.trim()) {
        bulletSlot.textContent =
          "Pick any bullet on the resume to populate this detail.";
      }
    }

    const embedContainer = docContent.querySelector(
      "[data-slot='embed-container']",
    );
    const embedFrame = docContent.querySelector("[data-slot='embed-frame']");
    if (embedFrame) {
      const isStaticEmbed =
        (embedContainer && embedContainer.hasAttribute("data-static-embed")) ||
        embedFrame.hasAttribute("data-static-embed");
      if (url) {
        embedFrame.src = url;
        if (embedContainer) {
          embedContainer.hidden = false;
          embedContainer.style.display = "flex";
        } else {
          embedFrame.hidden = false;
        }
      } else if (isStaticEmbed) {
        if (embedContainer) {
          embedContainer.hidden = false;
          embedContainer.style.display = "flex";
        } else {
          embedFrame.hidden = false;
        }
      } else {
        embedFrame.src = "about:blank";
        if (embedContainer) {
          embedContainer.hidden = true;
          embedContainer.style.display = "none";
        } else {
          embedFrame.hidden = true;
        }
      }
    }
  }

  async function populateDoc({
    section,
    roleTitle,
    bulletText,
    url,
    template,
  }) {
    if (sub) sub.textContent = section || "Selected bullet";
    if (title) title.textContent = roleTitle || "Detail view";

    const requestedTemplate = template || "default";
    const loadAndRender = async () => {
      try {
        await loadTemplate(requestedTemplate);
      } catch (error) {
        if (requestedTemplate !== "default") {
          await loadTemplate("default");
        } else {
          throw error;
        }
      }

      applyDocData({ section, roleTitle, bulletText, url });
      syncDocHeight();
    };

    const hasRenderableContent =
      docContent.childElementCount > 0 &&
      docContent.dataset &&
      docContent.dataset.template &&
      docContent.dataset.template !== "default";
    if (hasRenderableContent && deckAnimationState === "open") {
      await animateDocSwap(loadAndRender);
    } else {
      await loadAndRender();
    }
  }

  function syncDocHeight() {
    if (!doc || !paper) return;
    const paperHeight = paper.offsetHeight;
    doc.style.height = `${paperHeight}px`;
    doc.style.minHeight = `${paperHeight}px`;
    doc.style.maxHeight = `${paperHeight}px`;
  }

  function focusDoc() {
    doc.classList.add("focus");
    doc.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    doc.focus({ preventScroll: true });
  }

  // Open page content for each bullet
  $$(".bullet").forEach((btn) => {
    btn.addEventListener("click", async () => {
      lastTrigger = btn;
      showDeck();

      if (toast) {
        toast.classList.remove("show");
      }

      const templateName = btn.getAttribute("data-doc");
      const dataText = btn.getAttribute("data-text");
      const bulletText =
        dataText !== null
          ? dataText
          : templateName
            ? null
            : btn.textContent.trim();

      try {
        await populateDoc({
          section: btn.getAttribute("data-section"),
          roleTitle: btn.getAttribute("data-role"),
          bulletText,
          url: btn.getAttribute("data-url"),
          template: templateName,
        });
      } catch (error) {
        docContent.innerHTML =
          "<p>Unable to load resume details. Please refresh and try again.</p>";
        console.error(error);
      }

      requestAnimationFrame(focusDoc);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const closing = hideDeck();
      if (lastTrigger) {
        lastTrigger.focus();
      }
      const scrollToPaper = () => {
        paper.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      };
      if (closing && typeof closing.then === "function") {
        closing.then(scrollToPaper);
      } else {
        scrollToPaper();
      }
    });
  }

  populateDoc({ template: "default" }).catch(() => {
    docContent.innerHTML =
      "<p>Unable to load resume details. Please refresh the page.</p>";
  });
  syncDocHeight();
  window.addEventListener("resize", syncDocHeight);
})();
