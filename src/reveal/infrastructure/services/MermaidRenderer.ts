/**
 * Mermaid Renderer — Infrastructure
 * Renders Mermaid diagrams to SVG and manages DOM replacement.
 */

import mermaid from 'mermaid';
import { MERMAID_ATTRIBUTES, MERMAID_CLASSES } from '../../domain/constants';
import type { Logger } from '../../domain/reveal.model';

export type RenderResult = {
  success: boolean;
  container?: HTMLElement;
  error?: Error;
};

export interface MermaidRenderer {
  render(code: string, block: HTMLElement, index: number, isPrintMode: boolean): Promise<RenderResult>;
}

export class DefaultMermaidRenderer implements MermaidRenderer {
  constructor(private readonly logger: Logger) {}

  async render(
    code: string,
    block: HTMLElement,
    index: number,
    isPrintMode: boolean,
  ): Promise<RenderResult> {
    const pre = block.parentElement;

    if (pre === null) {
      const error = new Error('No parent element found for mermaid block');

      return { success: false, error };
    }

    try {
      block.setAttribute(MERMAID_ATTRIBUTES.RENDERED, 'true');

      const customMaxHeight = pre.style.maxHeight || null;
      const container = this.createDiagramContainer(code, isPrintMode, customMaxHeight);

      const diagramId = `mermaid-diagram-${Date.now()}-${index}`;
      const { svg } = await mermaid.render(diagramId, code);

      const svgWrapper = this.createSvgWrapper(svg, isPrintMode, customMaxHeight);
      container.appendChild(svgWrapper);

      pre.replaceWith(container);

      return { success: true, container };
    } catch (error) {
      const errorObj = error as Error;
      this.logger.error('Error rendering mermaid diagram:', {
        error: errorObj.message,
        index,
        codeLength: code.length,
      });

      this.handleRenderError(block, pre, errorObj);

      return { success: false, error: errorObj };
    }
  }

  private createDiagramContainer(
    code: string,
    isPrintMode: boolean,
    customMaxHeight: string | null,
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = MERMAID_CLASSES.DIAGRAM;
    container.setAttribute(MERMAID_ATTRIBUTES.ORIGINAL, code);

    const maxHeight = customMaxHeight || (isPrintMode ? 'none' : '65vh');

    if (isPrintMode) {
      container.style.cssText = `
        display: flex; justify-content: center; align-items: center;
        padding: 1rem; background: #ffffff; border: 1px solid #dee2e6;
        border-radius: 0.75rem; margin: 1rem auto; max-width: 90%;
        width: fit-content; overflow: visible;
        page-break-inside: avoid; break-inside: avoid;
      `;
    } else {
      container.style.cssText = `
        display: flex; justify-content: center; align-items: center;
        padding: 1rem; background: var(--bg-secondary);
        border-radius: 0.75rem; margin: 1rem auto;
        max-width: 95%; max-height: ${maxHeight}; overflow: hidden;
      `;
    }

    return container;
  }

  /**
   * Injects SVG content from mermaid.render() into a wrapper element.
   * The SVG is trusted output from the mermaid library, not user input.
   */
  private setSvgContent(wrapper: HTMLElement, svgContent: string): void {
    // SECURITY: svgContent comes exclusively from mermaid.render(),
    // which is a trusted library. This is not user-supplied HTML.
    wrapper.insertAdjacentHTML('afterbegin', svgContent);
  }

  private createSvgWrapper(
    svg: string,
    isPrintMode: boolean,
    customMaxHeight: string | null,
  ): HTMLElement {
    const svgWrapper = document.createElement('div');
    svgWrapper.className = MERMAID_CLASSES.SVG_WRAPPER;
    this.setSvgContent(svgWrapper, svg);

    const svgElement = svgWrapper.querySelector('svg');

    if (svgElement !== null) {
      const originalWidth = svgElement.getAttribute('width');
      const originalHeight = svgElement.getAttribute('height');
      const widthNum = originalWidth ? parseFloat(originalWidth.replace('px', '')) : 0;
      const heightNum = originalHeight ? parseFloat(originalHeight.replace('px', '')) : 0;

      if (!svgElement.getAttribute('viewBox') && widthNum > 0 && heightNum > 0) {
        svgElement.setAttribute('viewBox', `0 0 ${widthNum} ${heightNum}`);
      }

      const maxHeight = customMaxHeight || (isPrintMode ? '600px' : '55vh');

      svgElement.style.cssText = `
        width: 100%; height: auto; max-width: 90vw;
        max-height: ${maxHeight}; display: block; object-fit: contain;
      `;

      svgElement.removeAttribute('width');
      svgElement.removeAttribute('height');
    }

    const wrapperMaxHeight = customMaxHeight || (isPrintMode ? '600px' : '55vh');

    svgWrapper.style.cssText = `
      display: flex; justify-content: center; align-items: center;
      width: 100%; max-width: 90vw; max-height: ${wrapperMaxHeight}; overflow: hidden;
    `;

    return svgWrapper;
  }

  private handleRenderError(block: HTMLElement, pre: HTMLElement, error: Error): void {
    block.classList.add(MERMAID_CLASSES.ERROR);

    const errorMsg = document.createElement('div');
    errorMsg.className = MERMAID_CLASSES.ERROR_MESSAGE;
    errorMsg.textContent = `Mermaid Rendering Error: ${String(error)}`;
    errorMsg.style.cssText = `
      color: #ef4444; background: rgba(239,68,68,0.1);
      padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;
      font-family: monospace; font-size: 0.875rem; border: 1px solid #ef4444;
    `;
    pre.parentElement?.insertBefore(errorMsg, pre.nextSibling);
  }
}

export function createMermaidRenderer(logger: Logger): MermaidRenderer {
  return new DefaultMermaidRenderer(logger);
}
