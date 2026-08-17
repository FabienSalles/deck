import { describe, it, expect, beforeAll } from 'vitest';
import {
  CodeBlockResizeStrategy,
  TextFontSizeStrategy,
} from '../../src/reveal/infrastructure/services/ResizeStrategies';
import { computeOverflow } from '../../src/reveal/domain/overflow.service';
import { DEFAULT_RESIZE_OPTIONS } from '../../src/reveal/domain/constants';

// A slide whose content height scales with its font size, which is the one physical
// property the text strategy acts on. Everything the strategy touches is modelled and
// nothing else, so a failure points at the strategy rather than at the fake.
function makeSlide(contentHeightAtFullSize: number, viewportHeight: number): HTMLElement {
  const style = { fontSize: '' };
  const classes = new Set<string>();

  const scale = (): number => (style.fontSize === '' ? 1 : parseFloat(style.fontSize));

  return {
    style,
    offsetHeight: viewportHeight,
    get scrollHeight(): number {
      return Math.round(contentHeightAtFullSize * scale());
    },
    classList: {
      add: (name: string): void => void classes.add(name),
      remove: (name: string): void => void classes.delete(name),
      contains: (name: string): boolean => classes.has(name),
    },
    querySelectorAll: (): unknown[] => [],
  } as unknown as HTMLElement;
}

function measure(slide: HTMLElement) {
  return computeOverflow(slide.scrollHeight, slide.offsetHeight);
}

function fits(slide: HTMLElement, threshold: number): boolean {
  return slide.scrollHeight <= slide.offsetHeight + threshold;
}

const PRINT_THRESHOLD = 10;

function printStrategy(): TextFontSizeStrategy {
  return new TextFontSizeStrategy(
    true,
    DEFAULT_RESIZE_OPTIONS.minFontSize,
    DEFAULT_RESIZE_OPTIONS.maxFontSize,
    DEFAULT_RESIZE_OPTIONS.step,
  );
}

describe('TextFontSizeStrategy - convergence across repeated passes', () => {
  it('should bring an overflowing slide within its viewport on the first pass', async () => {
    // GIVEN a slide whose content is 40% taller than the viewport
    const slide = makeSlide(700, 500);

    // WHEN the strategy runs on a fresh measurement
    await printStrategy().apply(slide, measure(slide));

    // THEN the slide fits
    expect(fits(slide, PRINT_THRESHOLD)).toBe(true);
  });

  it('should keep the slide fitting when a second pass measures it after the first', async () => {
    // GIVEN a slide already brought within its viewport by a first pass
    const slide = makeSlide(700, 500);
    const strategy = printStrategy();
    await strategy.apply(slide, measure(slide));
    expect(fits(slide, PRINT_THRESHOLD)).toBe(true);

    // WHEN a second pass runs on a measurement taken after that first pass,
    // which is what the export pipeline and every re-render actually do
    await strategy.apply(slide, measure(slide));

    // THEN the slide still fits: a pass that finds nothing to do must change nothing
    expect(fits(slide, PRINT_THRESHOLD)).toBe(true);
  });

  it('should reach the same font size whatever the number of passes', async () => {
    // GIVEN two identical slides
    const once = makeSlide(700, 500);
    const repeatedly = makeSlide(700, 500);
    const strategy = printStrategy();

    // WHEN one is processed a single time and the other four times — an even count,
    // so a strategy that merely alternates between two states cannot pass by parity
    await strategy.apply(once, measure(once));

    for (let pass = 0; pass < 4; pass++) {
      await strategy.apply(repeatedly, measure(repeatedly));
    }

    // THEN they agree: the number of passes is not part of the result
    expect(repeatedly.style.fontSize).toBe(once.style.fontSize);
  });

  it('should leave a slide that already fits untouched', async () => {
    // GIVEN a slide whose content is well within the viewport
    const slide = makeSlide(300, 500);

    // WHEN the strategy runs
    await printStrategy().apply(slide, measure(slide));

    // THEN it still fits and no font size was imposed
    expect(fits(slide, PRINT_THRESHOLD)).toBe(true);
    expect(slide.style.fontSize).toBe('');
  });
});

// A slide carrying one code block whose height follows its font size. The strategy reads
// the computed style only the first time, so a window stub covers that single call.
function makeCodeSlide(viewportHeight: number, surroundingHeight: number, codeHeightAt16px: number) {
  const codeStyle = { fontSize: '', padding: '', lineHeight: '' };
  const preStyle = { maxHeight: '', overflow: '' };
  const dataset: Record<string, string> = {};

  const codeFontSize = (): number => (codeStyle.fontSize === '' ? 16 : parseFloat(codeStyle.fontSize));
  const codeHeight = (): number => Math.round((codeHeightAt16px * codeFontSize()) / 16);

  const code = {
    style: codeStyle,
    get scrollHeight(): number {
      return codeHeight();
    },
  };

  const pre = {
    style: preStyle,
    dataset,
    get offsetHeight(): number {
      return codeHeight();
    },
    querySelector: (): unknown => code,
    classList: { add: (): void => {} },
  };

  const slide = {
    offsetHeight: viewportHeight,
    get scrollHeight(): number {
      return surroundingHeight + codeHeight();
    },
    querySelectorAll: (): unknown[] => [pre],
  } as unknown as HTMLElement;

  return { slide, codeFontSize };
}

describe('CodeBlockResizeStrategy - convergence across repeated passes', () => {
  beforeAll(() => {
    (globalThis as { window?: unknown }).window = {
      getComputedStyle: (): { fontSize: string; padding: string } => ({
        fontSize: '16px',
        padding: '1rem',
      }),
    };
  });

  it('should shrink a code block that pushes its slide past the viewport', async () => {
    // GIVEN a slide overflowing because of its code block
    const { slide, codeFontSize } = makeCodeSlide(500, 200, 400);

    // WHEN the strategy runs
    await new CodeBlockResizeStrategy(true).apply(slide);

    // THEN the code font was reduced and the slide fits
    expect(codeFontSize()).toBeLessThan(16);
    expect(slide.scrollHeight).toBeLessThanOrEqual(slide.offsetHeight);
  });

  it('should never grow a code font back on a later pass', async () => {
    // GIVEN a code block already reduced by a first pass
    const { slide, codeFontSize } = makeCodeSlide(500, 200, 400);
    const strategy = new CodeBlockResizeStrategy(true);
    await strategy.apply(slide);
    const afterFirstPass = codeFontSize();

    // WHEN a second pass runs, measuring a slide that now fits
    await strategy.apply(slide);

    // THEN the font never grows back: reductions only ever accumulate
    expect(codeFontSize()).toBeLessThanOrEqual(afterFirstPass);
  });
});
