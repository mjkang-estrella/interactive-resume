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
    const TEMPLATE_DIR = "doc-pages";
    let activeTemplate = null;

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
        deck.hidden = false;
        page.classList.remove("deck-hidden");
    }

    function hideDeck() {
        if (deck.hidden) return;
        deck.hidden = true;
        page.classList.add("deck-hidden");
        doc.classList.remove("focus");
    }

    function normalizeTemplateName(name) {
        if (!name) return "default";
        const cleaned = name.toLowerCase().replace(/[^a-z0-9-_]/g, "");
        return cleaned || "default";
    }

    async function loadTemplate(requested) {
        const templateName = normalizeTemplateName(requested);
        if (activeTemplate === templateName && docContent.dataset.template === templateName) {
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

        const sectionLabelSlot = docContent.querySelector("[data-slot='section-label']");
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

        const embedContainer = docContent.querySelector("[data-slot='embed-container']");
        const embedFrame = docContent.querySelector("[data-slot='embed-frame']");
        if (embedFrame) {
            if (url) {
                embedFrame.src = url;
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

    async function populateDoc({ section, roleTitle, bulletText, url, template }) {
        if (sub) sub.textContent = section || "Selected bullet";
        if (title) title.textContent = roleTitle || "Detail view";

        const requestedTemplate = template || "default";
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
                dataText !== null ? dataText : templateName ? null : btn.textContent.trim();

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
            hideDeck();
            if (lastTrigger) {
                lastTrigger.focus();
            }
            requestAnimationFrame(() => {
                paper.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                });
            });
        });
    }

    populateDoc({ template: "default" }).catch(() => {
        docContent.innerHTML =
            "<p>Unable to load resume details. Please refresh the page.</p>";
    });
    syncDocHeight();
    window.addEventListener("resize", syncDocHeight);
})();
