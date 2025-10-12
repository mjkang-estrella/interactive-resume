/**
 * ChatKit configuration for the floating AI agent widget.
 *
 * Replace the placeholder values below with your real backend endpoints,
 * agent identifiers, and authentication headers. This file is loaded before
 * `agentkit.js` and should only contain non-sensitive, client-safe values.
 */
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
        label: "AI Agent",
        hint: "Resume, Interview Questions",
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
        greeting: "Hi — I’m an AI assistant trained on MJ Kang’s resume. Ask me anything about his experience, impact, and philosophy.",
        prompts: [
          {
            icon: "circle-question",
            label: "What can you do?",
            prompt: "What can this assistant answer, and what data is it using?"
          },
          // TMAY
          {
            icon: "person-speaking",
            label: "Tell me about yourself",
            prompt: "Give MJ’s 90-second 'Tell me about yourself' answer."
          },

          // Impact / Growth
          {
            icon: "analytics",
            label: "Show growth impact",
            prompt: "Summarize MJ’s top 3 measurable wins (with metrics)."
          },

          // Behavioral set
          {
            icon: "chat-sparkle",
            label: "Cross-Functional Leadership example",
            prompt: "Share a STAR story where MJ led a cross-functional team."
          },
          {
            icon: "lightbulb",
            label: "Product philosophy",
            prompt: "How does MJ balance user needs, speed, and business goals?"
          }
        ],
    },
};
