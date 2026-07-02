## Welcome to @conveycode/deck

A modern presentation framework built on Reveal.js and Astro.

- Create slides with Markdown <!-- .element: class="fragment" -->
- Add code highlighting out of the box <!-- .element: class="fragment" -->
- Export to PDF with a single command <!-- .element: class="fragment" -->
- Fully customizable themes and plugins <!-- .element: class="fragment" -->

Note: This is the intro slide. Use it to set context for your audience. Speaker notes appear here and are visible in the presenter view (press S).

---

## Code Highlighting

TypeScript example with line highlights:

```typescript [1-3|5-8|10]
import { initReveal } from '@conveycode/deck';
import { mermaidPlugin } from '@conveycode/deck/plugins';
import { autoResizePlugin } from '@conveycode/deck/plugins';

const deck = initReveal({
  plugins: [mermaidPlugin, autoResizePlugin],
  transition: 'slide',
});

deck.initialize();
```

Note: Code blocks support line-by-line highlighting with the `[lines]` syntax. Use `|` to separate highlight steps.
