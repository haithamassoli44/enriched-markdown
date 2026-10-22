import { renderToStaticMarkup } from 'react-dom/server';
import { RenderNode } from '../src/web/renderers';
import { normalizeMarkdownStyle } from '../src/normalizeMarkdownStyle.web';
import { buildStyles } from '../src/web/styles';
import type { ASTNode, RenderCapabilities } from '../src/web/types';

const text = (content: string): ASTNode => ({ type: 'Text', content });
const node = (
  type: ASTNode['type'],
  children: ASTNode[] = [],
  attributes?: ASTNode['attributes']
): ASTNode => ({ type, children, attributes });

const doc = [
  node('Paragraph', [text('مرحبا')]),
  node('Heading', [text('عنوان')], { level: '2' }),
  node('Blockquote', [node('Paragraph', [text('اقتباس')])]),
  node('UnorderedList', [
    node('ListItem', [
      node('Paragraph', [text('بند')]),
      node('UnorderedList', [node('ListItem', [text('nested')])]),
    ]),
  ]),
  node('Table', [
    node('TableHead', [
      node('TableRow', [node('TableHeaderCell', [text('الاسم')])]),
    ]),
  ]),
  node('CodeBlock', [text('code')]),
];

function html(blockDir: RenderCapabilities['blockDir']): string {
  const style = normalizeMarkdownStyle({});
  return renderToStaticMarkup(
    <>
      {doc.map((child, i) => (
        <RenderNode
          key={i}
          node={child}
          style={style}
          styles={buildStyles(style)}
          callbacks={{}}
          capabilities={{
            katex: null,
            enableTaskListItemToggle: true,
            blockDir,
          }}
        />
      ))}
    </>
  );
}

describe('web renderer direction', () => {
  it('gives each top-level block dir="auto" so it resolves from its content', () => {
    const out = html('auto');
    for (const tag of ['p', 'h2', 'blockquote', 'ul', 'th']) {
      expect(out).toMatch(new RegExp(`<${tag}[^>]*dir="auto"`));
    }
    // Nested blocks inherit, or they would hide their text from the parent's
    // first-strong scan (quote border / list marker on the wrong side).
    expect(out.match(/dir="auto"/g)).toHaveLength(5);
    expect(out).not.toMatch(/<pre[^>]*dir=/);
  });

  it('leaves blocks to inherit a forced root direction', () => {
    expect(html(undefined)).not.toMatch(/dir=/);
  });

  it('aligns unaligned table cells to the start edge', () => {
    expect(html('auto')).toMatch(/<th[^>]*text-align:start/);
  });
});
