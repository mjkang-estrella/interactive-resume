(function () {
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const page = $(".page");
    const deck = $("#deck");
    const doc = $("#deck-doc");
    const paper = $("#paper");
    if (!page || !deck || !doc || !paper) return;

    const sub = $(".doc-sub", doc);
    const title = $(".doc-title", doc);
    const role = $(".doc-role", doc);
    const sectionLabel = $(".doc-section", doc);
    const bullet = $(".doc-bullet", doc);
    const closeBtn = $(".doc-close", doc);
    const toast = $("#tip-toast");

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

    function updateDoc({ section, roleTitle, bulletText }) {
        if (sub) sub.textContent = section || "Selected bullet";
        if (sectionLabel) sectionLabel.textContent = section || "";
        if (title) title.textContent = roleTitle || "Detail view";
        if (role) role.textContent = roleTitle || "Role";
        if (bullet) {
            bullet.textContent =
                bulletText || "Pick any bullet on the resume to populate this detail.";
        }
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
        btn.addEventListener("click", () => {
            lastTrigger = btn;
            showDeck();

            if (toast) {
                toast.classList.remove("show");
            }

            updateDoc({
                section: btn.getAttribute("data-section"),
                roleTitle: btn.getAttribute("data-role"),
                bulletText:
                    btn.getAttribute("data-text") || btn.textContent.trim(),
            });

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
})();
