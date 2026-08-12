function extractText(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('\n');
  if (node && typeof node === 'object') {
    if (node.text) return node.text; // Text node in ProseMirror/TipTap JSON
    if (node.children) return extractText(node.children) + '\n';
    if (node.content) return extractText(node.content) + '\n';
  }
  return '';
}
