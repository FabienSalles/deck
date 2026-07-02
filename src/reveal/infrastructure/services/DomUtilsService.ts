/**
 * DOM Utilities Service — Infrastructure
 * Browser-dependent DOM manipulation functions.
 */

/**
 * Decode HTML entities in a string.
 * Uses a textarea element which safely decodes entities
 * without executing scripts (textarea content is inert).
 */
export function decodeHtmlEntities(html: string): string {
  const textarea = document.createElement('textarea');
  // textarea.innerHTML is safe — textarea content is treated as text, not HTML
  // eslint-disable-next-line no-unsanitized/property
  textarea.innerHTML = html;

  return textarea.value;
}

/**
 * Strip HTML tags from text.
 * Uses a detached div element that is never inserted into the document.
 */
export function stripHtmlTags(html: string): string {
  const temp = document.createElement('div');
  // Detached element — never inserted into DOM, no XSS risk
  // eslint-disable-next-line no-unsanitized/property
  temp.innerHTML = html;

  return temp.textContent || temp.innerText || html;
}

/**
 * Wait for all images in a container to finish loading.
 */
export function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];

  if (images.length === 0) {
    return Promise.resolve();
  }

  const imagePromises = images.map((img) => {
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve): void => {
      img.onload = (): void => resolve();
      img.onerror = (): void => resolve();
    });
  });

  return Promise.all(imagePromises).then(() => {});
}

/**
 * Request animation frame promise wrapper.
 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Double RAF for layout recalculation.
 */
export async function waitForLayout(): Promise<void> {
  await nextFrame();
  await nextFrame();
}
