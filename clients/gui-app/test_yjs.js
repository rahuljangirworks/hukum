import * as Y from 'yjs';
const doc = new Y.Doc();
const fragment = doc.getXmlFragment('test');
const node = new Y.XmlElement('codeBlock');
const text = new Y.XmlText('<html>hello</html>');
node.insert(0, [text]);
fragment.insert(0, [node]);

function extractInlineText(node) {
  if (!node.toArray) {
    const delta = node.toDelta?.();
    if (delta) return delta.map((d) => String(d.insert ?? "")).join("");
    return node.toString?.() ?? "";
  }
  return node.toArray().map((child) => {
    const delta = child.toDelta?.();
    if (delta) return delta.map((d) => String(d.insert ?? "")).join("");
    if (child.toArray) return extractInlineText(child);
    return child.toString?.() ?? "";
  }).join("");
}

function renderFragmentToText(fragment) {
  const children = fragment.toArray();
  if (children.length === 1 && children[0].nodeName === "codeBlock") {
    return extractInlineText(children[0]);
  }
  return "fallback";
}

console.log("Extracted:", renderFragmentToText(fragment));
