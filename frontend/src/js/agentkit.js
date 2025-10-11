(function () {
    "use strict";

    const CONFIG = window.AGENTKIT_CONFIG || null;
    if (!CONFIG) {
        console.warn("[AgentKit] Missing window.AGENTKIT_CONFIG. Skipping widget init.");
        return;
    }

    const STORAGE_KEY = "agentkit.threadId";
    const SCRIPT_SELECTOR = 'script[data-agentkit-loader="chatkit"]';

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    }

    function waitForChatKitDefinition() {
        if (customElements.get("openai-chatkit")) {
            return Promise.resolve();
        }

        const script = document.querySelector(SCRIPT_SELECTOR);
        if (!script) {
            return Promise.reject(new Error("ChatKit loader script not found."));
        }

        return new Promise((resolve, reject) => {
            const handleLoad = () => resolve();
            const handleError = () =>
                reject(new Error("Failed to load ChatKit script from CDN."));
            script.addEventListener("load", handleLoad, { once: true });
            script.addEventListener("error", handleError, { once: true });
        });
    }

    function getStoredThreadId() {
        if (!CONFIG.persistThread) {
            return null;
        }
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn("[AgentKit] Unable to read stored thread ID.", error);
            return null;
        }
    }

    function persistThreadId(threadId) {
        if (!CONFIG.persistThread) {
            return;
        }
        try {
            if (threadId) {
                window.localStorage.setItem(STORAGE_KEY, threadId);
            } else {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.warn("[AgentKit] Unable to persist thread ID.", error);
        }
    }

    function buildHostedApiOptions() {
        const hosted = CONFIG.hosted || {};
        const startUrl = hosted.startUrl;
        const refreshUrl = hosted.refreshUrl || hosted.startUrl;

        if (!startUrl) {
            throw new Error("AgentKit hosted.startUrl is required when integrationType is 'hosted'.");
        }

        return {
            async getClientSecret(currentClientSecret) {
                const isRefresh = Boolean(currentClientSecret);
                const targetUrl = isRefresh && refreshUrl ? refreshUrl : startUrl;
                const payload = {};
                if (hosted.agentId) {
                    payload.agent_id = hosted.agentId;
                }
                if (isRefresh && targetUrl === refreshUrl) {
                    payload.current_client_secret = currentClientSecret;
                }

                const headers = Object.assign(
                    {
                        "Content-Type": "application/json",
                    },
                    hosted.headers || {}
                );

                if (hosted.authToken) {
                    headers.Authorization = `Bearer ${hosted.authToken}`;
                }

                const response = await fetch(targetUrl, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                    credentials: hosted.credentials || "same-origin",
                });

                if (!response.ok) {
                    const detail = await response.text();
                    throw new Error(
                        `AgentKit session request failed (${response.status}): ${detail}`
                    );
                }

                const data = await response.json();
                if (!data || typeof data.client_secret !== "string") {
                    throw new Error("AgentKit session response missing client_secret.");
                }

                if (data.thread_id) {
                    persistThreadId(data.thread_id);
                }

                return data.client_secret;
            },
        };
    }

    function buildCustomApiOptions() {
        const custom = CONFIG.custom || {};
        if (!custom.url) {
            throw new Error("AgentKit custom.url is required when integrationType is 'custom'.");
        }
        if (!custom.domainKey) {
            throw new Error("AgentKit custom.domainKey is required when integrationType is 'custom'.");
        }

        return {
            url: custom.url,
            domainKey: custom.domainKey,
            uploadStrategy: custom.uploadStrategy || undefined,
            fetch(input, init = {}) {
                let headers = init.headers ? new Headers(init.headers) : new Headers();
                if (custom.authHeaderFactory) {
                    const authHeaders = custom.authHeaderFactory();
                    if (authHeaders && typeof authHeaders === "object") {
                        Object.entries(authHeaders).forEach(([key, value]) => {
                            if (typeof value === "string") {
                                headers.set(key, value);
                            }
                        });
                    }
                }
                return fetch(input, { ...init, headers });
            },
        };
    }

    function buildChatKitOptions() {
        const options = {
            theme: CONFIG.theme || undefined,
            composer: CONFIG.composer || undefined,
            startScreen: CONFIG.startScreen || undefined,
            initialThread: getStoredThreadId(),
        };

        if (CONFIG.integrationType === "custom") {
            options.api = buildCustomApiOptions();
        } else {
            options.api = buildHostedApiOptions();
        }

        if (CONFIG.widgets) {
            options.widgets = CONFIG.widgets;
        }
        if (CONFIG.entities) {
            options.entities = CONFIG.entities;
        }
        if (CONFIG.history) {
            options.history = CONFIG.history;
        }

        return options;
    }

    function toggleState({ container, launcher, panel }, open) {
        container.dataset.state = open ? "open" : "closed";
        launcher.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
            panel.removeAttribute("hidden");
            requestAnimationFrame(() => {
                panel.focusComposer?.().catch(() => {
                    /* swallow focus errors */
                });
            });
        } else {
            panel.setAttribute("hidden", "");
        }
    }

    ready(() => {
        const container = document.querySelector("[data-agentkit]");
        const launcher = container?.querySelector('[data-action="toggle-agentkit"]');
        const panel = container?.querySelector("[data-agentkit-panel]");
        const banner = container?.querySelector("[data-agentkit-banner]");

        if (!container || !launcher || !panel) {
            console.warn("[AgentKit] Widget markup not found. Skipping init.");
            return;
        }

        const labelText = launcher.querySelector(".agentkit__launcher-label span:last-child");
        if (CONFIG.launcher?.label && labelText) {
            labelText.textContent = CONFIG.launcher.label;
        }
        const hintText = launcher.querySelector(".agentkit__launcher-hint");
        if (CONFIG.launcher?.hint && hintText) {
            hintText.textContent = CONFIG.launcher.hint;
        }

        function showBanner(message, variant = "error") {
            if (!banner) return;
            banner.textContent = message;
            banner.dataset.variant = variant;
            banner.removeAttribute("hidden");
        }

        function hideBanner() {
            if (!banner) return;
            banner.setAttribute("hidden", "");
            delete banner.dataset.variant;
        }

        let optionsApplied = false;
        let isOpening = false;

        async function ensureOptionsApplied() {
            if (optionsApplied) {
                return;
            }

            await waitForChatKitDefinition();
            const options = buildChatKitOptions();
            panel.setOptions(options);
            optionsApplied = true;

            panel.addEventListener("chatkit.thread.change", (event) => {
                if (event?.detail) {
                    persistThreadId(event.detail.threadId || null);
                    hideBanner();
                }
            });

            panel.addEventListener("chatkit.error", (event) => {
                const detail = event.detail?.error;
                const message =
                    typeof detail?.message === "string"
                        ? detail.message
                        : "The AI agent ran into an unexpected error. Please try again.";
                showBanner(message, "warning");
                console.error("[AgentKit] ChatKit error", detail);
            });
        }

        async function openPanel() {
            if (container.dataset.state === "open" || isOpening) {
                return;
            }
            isOpening = true;
            try {
                hideBanner();
                await ensureOptionsApplied();
                toggleState({ container, launcher, panel }, true);
            } catch (error) {
                console.error("[AgentKit] Failed to open widget.", error);
                const message =
                    typeof error?.message === "string"
                        ? error.message
                        : "Unable to connect to the AI agent right now.";
                showBanner(message, "warning");
            } finally {
                isOpening = false;
            }
        }

        function closePanel() {
            if (container.dataset.state !== "open") {
                return;
            }
            toggleState({ container, launcher, panel }, false);
        }

        launcher.addEventListener("click", () => {
            if (container.dataset.state === "open") {
                closePanel();
            } else {
                void openPanel();
            }
        });

        container.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && container.dataset.state === "open") {
                closePanel();
            }
        });

        if (typeof CONFIG.launcher?.autoOpenDelay === "number") {
            window.setTimeout(() => {
                if (container.dataset.state !== "open") {
                    void openPanel();
                }
            }, CONFIG.launcher.autoOpenDelay);
        }
    });
})();
