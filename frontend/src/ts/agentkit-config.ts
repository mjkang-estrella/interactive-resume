/**
 * ChatKit configuration for the floating AI agent widget.
 *
 * Replace the placeholder values below with your real backend endpoints,
 * agent identifiers, and authentication headers.
 */

import type { AgentKitConfig } from './types/agentkit';

const hostedAgentId =
  import.meta.env.VITE_CHATKIT_AGENT_ID ??
  import.meta.env.OPENAI_AGENT_ID ??
  'replace-with-agent-id';

export const AGENTKIT_CONFIG: AgentKitConfig = {
  integrationType: 'hosted',

  hosted: {
    startUrl: '/api/chatkit/session',
    refreshUrl: '/api/chatkit/refresh',
    agentId: hostedAgentId,
    headers: {
      'Content-Type': 'application/json',
    },
    authToken: undefined,
  },

  custom: {
    url: '',
    domainKey: '',
    authHeaderFactory: undefined,
    uploadStrategy: undefined,
  },

  persistThread: true,

  launcher: {
    label: 'AI Agent',
    hint: 'Resume, Interview Questions',
    autoOpenDelay: undefined,
  },

  theme: {
    colorScheme: 'light',
    radius: 'pill',
    density: 'normal',
    typography: {
      baseSize: 14,
      fontFamily: 'Inter, sans-serif',
      fontSources: [
        {
          family: 'Inter',
          src: 'https://rsms.me/inter/font-files/Inter-Regular.woff2',
          weight: 400,
          style: 'normal',
        },
        {
          family: 'Inter',
          src: 'https://rsms.me/inter/font-files/Inter-Medium.woff2',
          weight: 500,
          style: 'normal',
        },
        {
          family: 'Inter',
          src: 'https://rsms.me/inter/font-files/Inter-SemiBold.woff2',
          weight: 600,
          style: 'normal',
        },
        {
          family: 'Inter',
          src: 'https://rsms.me/inter/font-files/Inter-Italic.woff2',
          weight: 400,
          style: 'italic',
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
        id: 'search_docs',
        label: 'Search docs',
        shortLabel: 'Docs',
        placeholderOverride: 'Search documentation',
        icon: 'book-open',
        pinned: false,
      },
      {
        id: 'share_resume',
        label: 'Share resume',
        shortLabel: 'Resume',
        placeholderOverride: 'Send the latest resume draft',
        icon: 'square-text',
        pinned: true,
      },
    ],
  },

  startScreen: {
    greeting:
      "What questions do you have about MJ’s Journey?",
    prompts: [
      {
        icon: 'circle-question',
        label: 'What can you do?',
        prompt: 'What can this assistant answer, and what data is it using?',
      },
      {
        icon: 'sparkle',
        label: 'Tell me about yourself',
        prompt: "Give MJ's 90-second 'Tell me about yourself' answer.",
      },
      {
        icon: 'analytics',
        label: 'Show growth impact',
        prompt: "Summarize MJ's top 3 measurable wins (with metrics).",
      },
      {
        icon: 'suitcase',
        label: 'Cross-Functional Leadership example',
        prompt: 'Share a STAR story where MJ led a cross-functional team.',
      },
      {
        icon: 'lightbulb',
        label: 'Product philosophy',
        prompt: 'How does MJ balance user needs, speed, and business goals?',
      },
    ],
  },
};

// Expose to window for the ChatKit CDN script
window.AGENTKIT_CONFIG = AGENTKIT_CONFIG;
