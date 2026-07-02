/**
 * Mermaid Block Validator — Infrastructure
 * DOM-dependent validation of mermaid code blocks before rendering.
 */

import { MERMAID_ATTRIBUTES } from '../../domain/constants';
import type { Logger } from '../../domain/reveal.model';
import { decodeHtmlEntities, stripHtmlTags } from './DomUtilsService';

export type MermaidBlock = {
  element: HTMLElement;
  code: string;
  isValid: boolean;
  error?: string;
};

export interface MermaidBlockValidator {
  validateBlock(block: HTMLElement, index: number): MermaidBlock | null;
  isBlockAlreadyRendered(block: HTMLElement): boolean;
}

const MERMAID_KEYWORDS = [
  'flowchart', 'graph', 'sequenceDiagram', 'classDiagram',
  'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
  'gitGraph', 'mindmap', 'timeline', 'sankey-beta', 'sankey',
  'xychart-beta', 'xychart', 'block-beta', 'block',
  'quadrantChart', 'requirementDiagram', 'C4Context', 'zenuml',
] as const;

export class DefaultMermaidBlockValidator implements MermaidBlockValidator {
  constructor(private readonly logger: Logger) {}

  isBlockAlreadyRendered(block: HTMLElement): boolean {
    return block.hasAttribute(MERMAID_ATTRIBUTES.RENDERED);
  }

  validateBlock(block: HTMLElement, index: number): MermaidBlock | null {
    let code = block.getAttribute(MERMAID_ATTRIBUTES.ORIGINAL) || block.textContent || '';

    code = decodeHtmlEntities(code).trim();

    if (code.length === 0) {
      this.logger.warn('Empty mermaid code block found');

      return null;
    }

    if (code.includes('<span') || code.includes('</span>')) {
      this.logger.error('Mermaid code still contains HTML tags! PreHighlightPlugin failed.');
      code = stripHtmlTags(code);
    }

    if (code.includes('#mermaid-') || code.includes('<svg') || code.includes('font-family:')) {
      return { element: block, code, isValid: false, error: 'Already rendered SVG' };
    }

    const hasMermaidKeyword = MERMAID_KEYWORDS.some((keyword) => code.includes(keyword));

    if (!hasMermaidKeyword) {
      this.logger.warn(`Block ${index} does not contain valid Mermaid syntax, skipping`);

      return { element: block, code, isValid: false, error: 'Invalid Mermaid syntax' };
    }

    return { element: block, code, isValid: true };
  }
}

export function createMermaidBlockValidator(logger: Logger): MermaidBlockValidator {
  return new DefaultMermaidBlockValidator(logger);
}
