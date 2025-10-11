/**
 * ChatKit configuration for the floating AI agent widget.
 *
 * Replace the placeholder values below with your real backend endpoints,
 * agent identifiers, and authentication headers.
 */

import type { AgentKitConfig } from './types/agentkit';

export const AGENTKIT_CONFIG: AgentKitConfig = {
  integrationType: 'hosted',

  hosted: {
    startUrl: '/api/chatkit/session',
    refreshUrl: '/api/chatkit/refresh',
    agentId: 'replace-with-agent-id',
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
    label: 'Ask the AI Agent',
    hint: 'Resume, projects, roadmap',
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
    greeting: "Hi! I can answer questions about MJ Kang's journey.",
    prompts: [
      {
        icon: 'circle-question',
        label: 'What is ChatKit?',
        prompt: 'What is ChatKit and how is it used on this site?',
      },
      {
        icon: 'analytics',
        label: 'Show growth wins',
        prompt: "Summarize MJ Kang's biggest growth experiments.",
      },
      {
        icon: 'sparkle',
        label: 'Product philosophy',
        prompt: "Describe MJ Kang's product philosophy and leadership style.",
      },
      {
        icon: 'suitcase',
        label: 'Training insights',
        prompt: 'How does MJ connect CrossFit coaching with product building?',
      },
      {
        icon: 'lightbulb',
        label: 'MBA prep',
        prompt: "What is MJ's plan heading into the Berkeley Haas MBA?",
      },
    ],
  },
};

// Expose to window for the ChatKit CDN script
window.AGENTKIT_CONFIG = AGENTKIT_CONFIG;
