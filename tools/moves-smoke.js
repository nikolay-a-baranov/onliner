const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs
  .readFileSync(path.join(__dirname, "../src/actions/moves.js"), "utf8")
  .replace("export const createMoves", "const createMoves");
const context = { console };
vm.createContext(context);
vm.runInContext(`${source}\nthis.createMoves = createMoves;`, context);

const api = {
  block(value) {
    return { start: 0, end: value.length };
  },
  set(element, value) {
    element.value = value;
  },
  doneData(element, data) {
    element.selectionStart = data.start;
    element.selectionEnd = data.end;
    return true;
  },
};
Object.assign(api, context.createMoves(api));

const move = (value, start, end, step) => {
  const element = { value, selectionStart: start, selectionEnd: end };
  assert.equal(api.move(element, step), true);
  return element.value;
};

const blockedMove = (value, start, step) => {
  const element = { value, selectionStart: start, selectionEnd: start };
  assert.equal(api.move(element, step), false);
  assert.equal(element.value, value);
};

assert.equal(move("А, б, в.", 3, 3, 1), "А, в, б.");
assert.equal(move("А, б, в.", 3, 3, -1), "Б, а, в.");
assert.equal(move("А, б, в.", 3, 5, 1), "А, в, б.");
assert.equal(move("А, б в, г.", 3, 6, 1), "А, г, б в.");
assert.equal(move("А б в.", 2, 2, 1), "А в б.");
assert.equal(move("А: б; в.", 3, 3, 1), "А: в; б.");

assert.equal(move("<li>first second</li>", 10, 10, -1), "<li>Second first</li>");
blockedMove("<ul><li>first</li><li>second</li></ul>", 24, -1);
blockedMove("<ul><li>first</li><li>second</li></ul>", 19, -1);

console.log("moves punctuation smoke: ok");
