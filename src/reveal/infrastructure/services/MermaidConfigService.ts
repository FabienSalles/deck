/**
 * Mermaid Configuration Service — Infrastructure
 * Manages Mermaid.js initialization and theme configuration.
 */

import mermaid from 'mermaid';
import type { MermaidConfig } from 'mermaid';

export type MermaidPluginOptions = {
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  flowchart?: {
    curve?: 'basis' | 'linear' | 'cardinal';
  };
};

export interface MermaidConfigService {
  initialize(options: MermaidPluginOptions, isPrintMode: boolean): void;
  reinitialize(theme: 'default' | 'dark'): void;
  getCurrentTheme(): string;
}

export class DefaultMermaidConfigService implements MermaidConfigService {
  private currentTheme = 'dark';

  initialize(options: MermaidPluginOptions, isPrintMode: boolean): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const mermaidTheme = isPrintMode ? 'default' : currentTheme === 'light' ? 'default' : 'dark';
    this.currentTheme = mermaidTheme;

    const config = this.buildConfig(options, mermaidTheme);
    mermaid.initialize(config);
  }

  reinitialize(theme: 'default' | 'dark'): void {
    this.currentTheme = theme;
    const config = this.buildConfig({}, theme);
    mermaid.initialize(config);
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  private buildConfig(options: MermaidPluginOptions, theme: string): MermaidConfig {
    return {
      startOnLoad: false,
      theme: (options.theme || theme) as 'dark' | 'default' | 'forest' | 'neutral',
      securityLevel: 'loose',
      logLevel: 'error',
      flowchart: {
        curve: options.flowchart?.curve || 'basis',
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 50,
        htmlLabels: true,
        useMaxWidth: false,
        wrappingWidth: 200,
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        useMaxWidth: false,
      },
      block: {
        padding: 8,
        useMaxWidth: false,
      },
      themeCSS: `
        .node rect, .node circle, .node polygon { max-width: 100%; }
        .nodeLabel { font-size: 14px; }
        .edgeLabel { font-size: 12px; color: #1f2937 !important; }
        .edgeLabel span, .edgeLabel p { color: #1f2937 !important; background: rgba(255,255,255,0.9) !important; }
        .cluster-label { font-size: 16px !important; font-weight: 600 !important; fill: #1f2937 !important; }
        .cluster-label span { color: #1f2937 !important; background: transparent !important; }
        .node rect, .node polygon { rx: 5px; ry: 5px; }
        .node .label { padding: 8px 12px !important; }
        .node foreignObject { overflow: visible !important; }
        .node foreignObject div { padding: 4px 8px !important; white-space: nowrap !important; }
        marker { transform: scale(0.6) !important; transform-origin: center !important; }
        marker path { stroke-width: 0.5px !important; }
      `,
      fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
      themeVariables: {
        primaryColor: '#f8fafc',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#334155',
        secondaryColor: '#f1f5f9',
        secondaryTextColor: '#0f172a',
        secondaryBorderColor: '#475569',
        tertiaryColor: '#e2e8f0',
        tertiaryTextColor: '#0f172a',
        tertiaryBorderColor: '#64748b',
        lineColor: '#334155',
        clusterBkg: '#e2e8f0',
        clusterBorder: '#475569',
        fontSize: '14px',
        background: '#ffffff',
        mainBkg: '#f8fafc',
        nodeBorder: '#334155',
        nodeTextColor: '#0f172a',
        textColor: '#0f172a',
      },
    };
  }
}

export function createMermaidConfigService(): MermaidConfigService {
  return new DefaultMermaidConfigService();
}
