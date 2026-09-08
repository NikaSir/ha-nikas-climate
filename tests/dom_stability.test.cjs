const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const project = path.resolve(__dirname, "..");
const frontend = path.join(project, "custom_components/nikas_climate/frontend");
const productionPath = path.join(frontend, "nikas-climate-production.js");
const production = fs.readFileSync(productionPath, "utf8");

assert.doesNotMatch(production, /\bdevices\.innerHTML\s*=/, "peer selector must not be rebuilt live");
assert.doesNotMatch(production, /\bcontent\.innerHTML\s*=/, "active view must not be rebuilt live");
assert.match(production, /content\.firstElementChild !== oldContent/, "outer compatibility layer must not reinsert an unchanged live root");

for (const name of ["131", "135", "136"]) {
  const source = fs.readFileSync(path.join(frontend, `nikas-climate-entry-${name}.js`), "utf8");
  assert.doesNotMatch(source, /this\.render\(|previousRender\.call\(this\)/, `registry completion in entry ${name} must patch, not render`);
}

const classes = new Map();
const context = vm.createContext({
  console, Map, Set, Date, Number, String, Boolean, Math, Promise, Object, Intl,
  HTMLElement: class { attachShadow() { this.shadowRoot = {}; } },
  localStorage: { getItem() { return null; }, setItem() {} },
  customElements: { get: name => classes.get(name), define: (name, type) => classes.set(name, type) },
});
vm.runInContext(`(()=>{${production}\n})();`, context, {filename: productionPath});
const Panel = classes.get("nikas-climate-panel");
assert(Panel);

let decoratedIcon = null;
const oldPeerIcon = {
  remove() { assert.fail("active peer decorator must not remove the existing HA icon"); },
  setAttribute(name, value) { decoratedIcon = {name, value}; },
};
const peerPanel = Object.create(Panel.prototype);
peerPanel.shadowRoot = {querySelectorAll: () => [{querySelector: () => oldPeerIcon}]};
peerPanel.roomModel = () => ({available: true, mode: "cool"});
peerPanel.modeIcon = () => "mdi:snowflake";
peerPanel.decoratePeers136();
assert.deepEqual(decoratedIcon, {name: "icon", value: "mdi:snowflake"});

let disconnects = 0;
class FakeNode {
  constructor(nodeType) {
    this.nodeType = nodeType;
    this.parentNode = null;
    this.isConnected = false;
  }

  connect(value) {
    if (this.isConnected && !value) disconnects += 1;
    this.isConnected = value;
    for (const child of this.childNodes || []) child.connect(value);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.childNodes.indexOf(this);
    this.parentNode.childNodes.splice(index, 1);
    this.parentNode = null;
    this.connect(false);
  }

  replaceWith(next) {
    const parent = this.parentNode;
    assert(parent, "replaceWith requires a parent in the fixture");
    const index = parent.childNodes.indexOf(this);
    this.parentNode = null;
    this.connect(false);
    next.parentNode = parent;
    parent.childNodes[index] = next;
    next.connect(parent.isConnected);
  }
}

class FakeText extends FakeNode {
  constructor(value) {
    super(3);
    this.nodeValue = value;
  }
}

class FakeElement extends FakeNode {
  constructor(tagName, attributes = {}, children = []) {
    super(1);
    this.tagName = tagName.toUpperCase();
    this._attributes = new Map(Object.entries(attributes).map(([name, value]) => [name, String(value)]));
    this.childNodes = [];
    for (const child of children) this.append(child);
  }

  get attributes() {
    return [...this._attributes].map(([name, value]) => ({name, value}));
  }

  get children() {
    return this.childNodes.filter(node => node.nodeType === 1);
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  getAttribute(name) {
    return this._attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this._attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this._attributes.delete(name);
  }

  append(child) {
    if (child.parentNode) child.remove();
    child.parentNode = this;
    this.childNodes.push(child);
    child.connect(this.isConnected);
  }
}

const text = value => new FakeText(value);
const element = (tag, attributes, children) => new FakeElement(tag, attributes, children);

const oldIcon = element("ha-icon", {icon: "mdi:power"}, []);
const oldValue = text("24°");
const oldGraph = element("svg", {viewBox: "0 0 10 10"}, [element("text", {}, [text("24")])]);
const oldSlot = element("div", {"data-history-chart": "temperature"}, [oldGraph]);
const oldRoot = element("section", {class: "card old"}, [oldIcon, element("strong", {}, [oldValue]), oldSlot]);
const live = element("div", {id: "content"}, [oldRoot]);
live.connect(true);

const freshRoot = element("section", {class: "card current"}, [
  element("ha-icon", {icon: "mdi:snowflake"}, []),
  element("strong", {}, [text("25°")]),
  element("div", {"data-history-chart": "temperature"}, []),
]);

const panel = new Panel();
panel.__reconcileDomChildren(live, [freshRoot]);
assert.equal(live.firstElementChild, oldRoot, "active view root identity must survive");
assert.equal(oldRoot.childNodes[0], oldIcon, "HA icon identity must survive");
assert.equal(oldRoot.childNodes[1].childNodes[0], oldValue, "text node identity must survive");
assert.equal(oldValue.nodeValue, "25°");
assert.equal(oldIcon.getAttribute("icon"), "mdi:snowflake");
assert.equal(oldRoot.getAttribute("class"), "card current");
assert.equal(oldSlot.firstElementChild, oldGraph, "an already mounted history graph must survive an empty placeholder");
assert.equal(disconnects, 0, "compatible live nodes must never disconnect");

const gesturePanel = new Panel();
gesturePanel._u158GestureActive = true;
gesturePanel.patch();
assert.equal(gesturePanel._u158PatchQueued, true, "HA updates during a gesture must be coalesced");

console.log("PASS: stable live DOM, peer/history preservation and gesture update queue");
