const assert = require("node:assert/strict");

const run = async () => {
  const location = {
    href: "https://www.onliner.by/",
    hostname: "www.onliner.by",
    pathname: "/",
  };
  global.location = location;
  global.window = { location };
  global.document = {
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getElementById() {
      return null;
    },
  };
  const { createAdmin } = await import("../src/actions/admin.js");
  const { admin } = createAdmin({});
  const normalize = admin.clean.credits.photo.normalize;
  assert.equal(normalize("Иван Иванов"), "Иван Иванов");
  assert.equal(normalize("Мікіта Юрчанка"), "Мікіта Юрчанка");
  assert.equal(normalize("Анна-Мария Иванова"), "Анна-Мария Иванова");
  assert.equal(normalize("Дар’я Лук’яненко"), "Дар’я Лук’яненко");
  assert.equal(normalize("Архив героя публикации"), "архив героя публикации");
  assert.equal(normalize("Ўласны архіў героя"), "ўласны архіў героя");
  assert.equal(normalize("Владислав Борисевич"), "Влад Борисевич");
  console.log("admin photo credits smoke: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
