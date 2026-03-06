import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCliDesignTokens } from '../framework-menu-ui-components-tokens';
import { renderPanel } from '../framework-menu-ui-components-panel';

test('renderPanel ajusta contenido al ancho configurado', () => {
  const tokens = buildCliDesignTokens({ width: 70, color: false });
  const panel = renderPanel(
    [
      'PUMUKI — Hook-System (run: npx ast-hooks)',
      'Source files → AST analyzers → violations → severity evaluation → AI Gate verdict',
    ],
    tokens
  );
  for (const line of panel.split('\n')) {
    assert.ok(line.length <= 70, `line exceeds panel width (70): ${line}`);
  }
});
