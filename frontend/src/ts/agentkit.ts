/**
 * AgentKit widget initialization and management
 */

import type { AgentKitConfig, ChatKitSession } from './types/agentkit';

const STORAGE_KEY = 'agentkit.threadId';
const SCRIPT_SELECTOR = 'script[data-agentkit-loader="chatkit"]';

class AgentKit {
  private config: AgentKitConfig;

  constructor() {
    const config = window.AGENTKIT_CONFIG;
    if (!config) {
      console.warn('[AgentKit] Missing window.AGENTKIT_CONFIG. Skipping widget init.');
      throw new Error('AgentKit config not found');
    }
    this.config = config;
  }

  private ready(callback: () => void): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  private waitForChatKitDefinition(): Promise<void> {
    if (customElements.get('openai-chatkit')) {
      return Promise.resolve();
    }

    const script = document.querySelector(SCRIPT_SELECTOR);
    if (!script) {
      return Promise.reject(new Error('ChatKit loader script not found.'));
    }

    return new Promise((resolve, reject) => {
      const handleLoad = () => resolve();
      const handleError = () => reject(new Error('Failed to load ChatKit script from CDN.'));
      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
    });
  }

  private getStoredThreadId(): string | null {
    if (!this.config.persistThread) {
      return null;
    }
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[AgentKit] Unable to read stored thread ID.', error);
      return null;
    }
  }

  private persistThreadId(threadId: string | null): void {
    if (!this.config.persistThread) {
      return;
    }
    try {
      if (threadId) {
        window.localStorage.setItem(STORAGE_KEY, threadId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('[AgentKit] Unable to persist thread ID.', error);
    }
  }

  private buildHostedApiOptions() {
    const hosted = this.config.hosted;
    if (!hosted) {
      throw new Error("AgentKit hosted configuration is missing.");
    }
    const startUrl = hosted.startUrl;
    const refreshUrl = hosted.refreshUrl || hosted.startUrl;

    if (!startUrl) {
      throw new Error("AgentKit hosted.startUrl is required when integrationType is 'hosted'.");
    }

    return {
      getClientSecret: async (currentClientSecret?: string): Promise<string> => {
        const isRefresh = Boolean(currentClientSecret);
        const targetUrl = isRefresh && refreshUrl ? refreshUrl : startUrl;
        const payload: Record<string, string> = {};

        if (hosted.agentId) {
          payload.agent_id = hosted.agentId;
        }
        if (isRefresh && targetUrl === refreshUrl && currentClientSecret) {
          payload.current_client_secret = currentClientSecret;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(hosted.headers || {}),
        };

        if (hosted.authToken) {
          headers.Authorization = `Bearer ${hosted.authToken}`;
        }

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          credentials: hosted.credentials || 'same-origin',
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`AgentKit session request failed (${response.status}): ${detail}`);
        }

        const data: ChatKitSession = await response.json();
        if (!data || typeof data.client_secret !== 'string') {
          throw new Error('AgentKit session response missing client_secret.');
        }

        if (data.thread_id) {
          this.persistThreadId(data.thread_id);
        }

        return data.client_secret;
      },
    };
  }

  private buildCustomApiOptions() {
    const custom = this.config.custom;
    if (!custom?.url) {
      throw new Error("AgentKit custom.url is required when integrationType is 'custom'.");
    }
    if (!custom.domainKey) {
      throw new Error("AgentKit custom.domainKey is required when integrationType is 'custom'.");
    }

    return {
      url: custom.url,
      domainKey: custom.domainKey,
      uploadStrategy: custom.uploadStrategy || undefined,
      fetch: (input: RequestInfo | URL, init: RequestInit = {}) => {
        const headers = new Headers(init.headers);
        if (custom.authHeaderFactory) {
          const authHeaders = custom.authHeaderFactory();
          if (authHeaders) {
            Object.entries(authHeaders).forEach(([key, value]) => {
              if (typeof value === 'string') {
                headers.set(key, value);
              }
            });
          }
        }
        return fetch(input, { ...init, headers });
      },
    };
  }

  private buildChatKitOptions() {
    const options: Record<string, unknown> = {
      theme: this.config.theme || undefined,
      composer: this.config.composer || undefined,
      startScreen: this.config.startScreen || undefined,
      initialThread: this.getStoredThreadId(),
    };

    if (this.config.integrationType === 'custom') {
      options.api = this.buildCustomApiOptions();
    } else {
      options.api = this.buildHostedApiOptions();
    }

    if (this.config.widgets) {
      options.widgets = this.config.widgets;
    }
    if (this.config.entities) {
      options.entities = this.config.entities;
    }
    if (this.config.history) {
      options.history = this.config.history;
    }

    return options;
  }

  private toggleState(
    elements: {
      container: HTMLElement;
      launcher: HTMLElement;
      panel: HTMLElement;
    },
    open: boolean
  ): void {
    elements.container.dataset.state = open ? 'open' : 'closed';
    elements.launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      elements.panel.removeAttribute('hidden');
      requestAnimationFrame(() => {
        (elements.panel as any).focusComposer?.().catch(() => {
          /* swallow focus errors */
        });
      });
    } else {
      elements.panel.setAttribute('hidden', '');
    }
  }

  public init(): void {
    this.ready(() => {
      const container = document.querySelector<HTMLElement>('[data-agentkit]');
      const launcher = container?.querySelector<HTMLElement>('[data-action="toggle-agentkit"]');
      const panel = container?.querySelector<HTMLElement>('[data-agentkit-panel]');
      const banner = container?.querySelector<HTMLElement>('[data-agentkit-banner]');

      if (!container || !launcher || !panel) {
        console.warn('[AgentKit] Widget markup not found. Skipping init.');
        return;
      }

      const labelText = launcher.querySelector<HTMLElement>(
        '.agentkit__launcher-label span:last-child'
      );
      if (this.config.launcher?.label && labelText) {
        labelText.textContent = this.config.launcher.label;
      }

      const hintText = launcher.querySelector<HTMLElement>('.agentkit__launcher-hint');
      if (this.config.launcher?.hint && hintText) {
        hintText.textContent = this.config.launcher.hint;
      }

      const showBanner = (message: string, variant: string = 'error') => {
        if (!banner) return;
        banner.textContent = message;
        banner.dataset.variant = variant;
        banner.removeAttribute('hidden');
      };

      const hideBanner = () => {
        if (!banner) return;
        banner.setAttribute('hidden', '');
        delete banner.dataset.variant;
      };

      let optionsApplied = false;
      let isOpening = false;

      const ensureOptionsApplied = async () => {
        if (optionsApplied) {
          return;
        }

        await this.waitForChatKitDefinition();
        const options = this.buildChatKitOptions();
        (panel as any).setOptions(options);
        optionsApplied = true;

        panel.addEventListener('chatkit.thread.change', ((event: CustomEvent) => {
          if (event?.detail) {
            this.persistThreadId(event.detail.threadId || null);
            hideBanner();
          }
        }) as EventListener);

        panel.addEventListener('chatkit.error', ((event: CustomEvent) => {
          const detail = event.detail?.error;
          const message =
            typeof detail?.message === 'string'
              ? detail.message
              : 'The AI agent ran into an unexpected error. Please try again.';
          showBanner(message, 'warning');
          console.error('[AgentKit] ChatKit error', detail);
        }) as EventListener);
      };

      const openPanel = async () => {
        if (container.dataset.state === 'open' || isOpening) {
          return;
        }
        isOpening = true;
        try {
          hideBanner();
          await ensureOptionsApplied();
          this.toggleState({ container, launcher, panel }, true);
        } catch (error) {
          console.error('[AgentKit] Failed to open widget.', error);
          const message =
            typeof (error as Error)?.message === 'string'
              ? (error as Error).message
              : 'Unable to connect to the AI agent right now.';
          showBanner(message, 'warning');
        } finally {
          isOpening = false;
        }
      };

      const closePanel = () => {
        if (container.dataset.state !== 'open') {
          return;
        }
        this.toggleState({ container, launcher, panel }, false);
      };

      launcher.addEventListener('click', () => {
        if (container.dataset.state === 'open') {
          closePanel();
        } else {
          void openPanel();
        }
      });

      container.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && container.dataset.state === 'open') {
          closePanel();
        }
      });

      if (typeof this.config.launcher?.autoOpenDelay === 'number') {
        window.setTimeout(() => {
          if (container.dataset.state !== 'open') {
            void openPanel();
          }
        }, this.config.launcher.autoOpenDelay);
      }
    });
  }
}

// Initialize AgentKit
try {
  const agentKit = new AgentKit();
  agentKit.init();
} catch (error) {
  console.warn('[AgentKit] Initialization skipped:', error);
}
