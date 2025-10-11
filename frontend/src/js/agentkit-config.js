/**
 * ChatKit configuration for the floating AI agent widget.
 *
 * Replace the placeholder values below with your real backend endpoints,
 * agent identifiers, and authentication headers. This file is loaded before
 * `agentkit.js` and should only contain non-sensitive, client-safe values.
 */
if (typeof window !== "undefined" && window.ENV_OPENAI_DOMAIN_KEY) {
    window.OPENAI_DOMAIN_KEY = window.ENV_OPENAI_DOMAIN_KEY;
}

window.AGENTKIT_CONFIG = {
    /**
     * Choose the integration mode to control how ChatKit reaches your backend.
     * - "hosted": your backend issues short-lived client secrets via the OpenAI AgentKit API.
     * - "custom": you expose an OpenAI-compatible API (or proxy) that follows the ChatKit spec.
     */
    integrationType: "hosted",

    /**
     * Hosted configuration (default). Update `startUrl`, `refreshUrl`, and `agentId`
     * to match your server endpoints. Both endpoints should return `{ client_secret: string }`.
     */
    hosted: {
        startUrl: "/api/chatkit/session",
        refreshUrl: "/api/chatkit/refresh",
        agentId: "replace-with-agent-id",
        headers: {
            "Content-Type": "application/json",
        },
        /**
         * Optional bearer token or session cookie you expose to the client.
         * Leave null if your backend uses first-party cookies.
         */
        authToken: null,
    },

    /**
     * Custom backend configuration. Populate these fields when you proxy ChatKit
     * requests through your own API instead of using hosted sessions.
     */
    custom: {
        url: "",
        domainKey: "",
        /**
         * Provide a function that returns the headers for each request when using a custom API.
         * Example:
         * () => ({ Authorization: `Bearer ${window.sessionStorage.getItem("token")}` })
         */
        authHeaderFactory: null,
        /**
         * Optional upload strategy is required when attachments are enabled and you manage uploads.
         * Example:
         * { type: "direct", uploadUrl: "https://your-domain.com/api/chatkit/upload" }
         */
        uploadStrategy: null,
    },

    /**
     * Persist the active thread ID in localStorage to keep the same conversation
     * when visitors navigate away and return.
     */
    persistThread: true,

    /**
     * Launcher button copy and behavioural tweaks.
     */
    launcher: {
        label: "Ask the AI Agent",
        hint: "Resume, projects, roadmap",
        /**
         * Optional auto-open delay in milliseconds. Set to a number to auto-open the widget.
         */
        autoOpenDelay: null,
    },

    /**
     * Visual theme inspired by the snippet provided.
     * Feel free to sync these values with variables in style.css.
     */
    theme: {
        colorScheme: "light",
        radius: "pill",
        density: "normal",
        typography: {
            baseSize: 14,
            fontFamily: "Inter, sans-serif",
            fontSources: [
                {
                    family: "Inter",
                    src: "https://rsms.me/inter/font-files/Inter-Regular.woff2",
                    weight: 400,
                    style: "normal",
                },
                {
                    family: "Inter",
                    src: "https://rsms.me/inter/font-files/Inter-Medium.woff2",
                    weight: 500,
                    style: "normal",
                },
                {
                    family: "Inter",
                    src: "https://rsms.me/inter/font-files/Inter-SemiBold.woff2",
                    weight: 600,
                    style: "normal",
                },
                {
                    family: "Inter",
                    src: "https://rsms.me/inter/font-files/Inter-Italic.woff2",
                    weight: 400,
                    style: "italic",
                },
            ],
        },
    },

    composer: {
        attachments: {
            enabled: true,
            maxCount: 5,
            maxSize: 10_485_760, // 10 MB
        },
        tools: [
            {
                id: "search_docs",
                label: "Search docs",
                shortLabel: "Docs",
                placeholderOverride: "Search documentation",
                icon: "book-open",
                pinned: false,
            },
            {
                id: "share_resume",
                label: "Share resume",
                shortLabel: "Resume",
                placeholderOverride: "Send the latest resume draft",
                icon: "square-text",
                pinned: true,
            },
        ],
    },

    startScreen: {
        greeting: "Hi! I can answer questions about MJ Kang’s journey.",
        prompts: [
            {
                icon: "circle-question",
                label: "What is ChatKit?",
                prompt: "What is ChatKit and how is it used on this site?",
            },
            {
                icon: "analytics",
                label: "Show growth wins",
                prompt: "Summarize MJ Kang’s biggest growth experiments.",
            },
            {
                icon: "sparkle",
                label: "Product philosophy",
                prompt: "Describe MJ Kang’s product philosophy and leadership style.",
            },
            {
                icon: "suitcase",
                label: "Training insights",
                prompt: "How does MJ connect CrossFit coaching with product building?",
            },
            {
                icon: "lightbulb",
                label: "MBA prep",
                prompt: "What is MJ’s plan heading into the Berkeley Haas MBA?",
            },
        ],
    },
};
