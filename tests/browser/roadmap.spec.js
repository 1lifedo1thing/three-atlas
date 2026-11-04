import { test, expect } from '@playwright/test';

test('Roadmap 可用于另一页，标题标注和所有文案来自传入内容', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const module = await import('/src/ui/components/roadmap.js').catch(() => null);
    if (!module?.Roadmap) return null;
    const el = module.Roadmap({ id: 'future-work', eyebrow: 'Next', title: 'New worlds.', lede: 'A place for the next work.', badge: 'In progress' });
    return { id: el.id, label: el.getAttribute('aria-labelledby'), title: el.querySelector('h2')?.id, text: el.textContent };
  });
  expect(result).not.toBeNull();
  expect(result.id).toBe('future-work');
  expect(result.label).toBe(result.title);
  expect(result.text).toContain('New worlds.');
  expect(result.text).toContain('A place for the next work.');
  expect(result.text).toContain('In progress');
  expect(result.text).not.toContain('让世界连在一起');
});
