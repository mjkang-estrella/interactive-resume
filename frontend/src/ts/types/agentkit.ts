/**
 * AgentKit type definitions
 */

export interface ChatKitSession {
  client_secret: string;
  expires_at: string;
  session_id: string;
  thread_id?: string;
}

export interface AgentKitHostedConfig {
  startUrl: string;
  refreshUrl?: string;
  agentId?: string;
  domainKey?: string;
  authToken?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface AgentKitCustomConfig {
  url: string;
  domainKey: string;
  uploadStrategy?: string;
  authHeaderFactory?: () => Record<string, string> | null;
}

export interface AgentKitLauncherConfig {
  label?: string;
  hint?: string;
  autoOpenDelay?: number;
}

export interface AgentKitConfig {
  integrationType: 'hosted' | 'custom';
  hosted?: AgentKitHostedConfig;
  custom?: AgentKitCustomConfig;
  launcher?: AgentKitLauncherConfig;
  persistThread?: boolean;
  theme?: Record<string, unknown>;
  composer?: Record<string, unknown>;
  startScreen?: Record<string, unknown>;
  widgets?: Record<string, unknown>;
  entities?: Record<string, unknown>;
  history?: Record<string, unknown>;
}

declare global {
  interface Window {
    AGENTKIT_CONFIG?: AgentKitConfig;
  }
}
