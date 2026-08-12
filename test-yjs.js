const Y = require('yjs');
const doc = new Y.Doc();
const fragment = doc.getXmlFragment('test');
const paragraph = new Y.XmlElement('paragraph');
const text = new Y.XmlText('<!DOCTYPE html>\n<html>');
paragraph.insert(0, [text]);
fragment.insert(0, [paragraph]);

console.log("toString:", fragment.toString());
console.log("toJSON:", JSON.stringify(fragment.toJSON()));
