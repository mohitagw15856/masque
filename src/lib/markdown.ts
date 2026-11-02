/** Tiny, safe markdown: escapes HTML first, then adds bold/italic/code/lists/paragraphs. */
export function renderMarkdown(src: string): string {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');

  const blocks = esc.split(/\n{2,}/);
  return blocks
    .map((b) => {
      const lines = b.split('\n');
      if (lines.every((l) => /^\s*[-•]\s+/.test(l)))
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`;
      if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l)))
        return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      if (/^\s*#{1,3}\s+/.test(lines[0])) return `<h4>${inline(lines[0].replace(/^\s*#{1,3}\s+/, ''))}</h4>`;
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}

export function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/\([^)]*\)/g, (m) => (/[A-Za-z]{3,}/.test(m) ? '' : m))
    .replace(/\s+/g, ' ')
    .trim();
}
