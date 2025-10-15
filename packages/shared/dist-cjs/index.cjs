"use strict";

const session = require("./chatkit/session.cjs");
const controllers = require("./chatkit/controllers.cjs");

const merged = {};
for (const mod of [session, controllers]) {
  Object.defineProperties(merged, Object.getOwnPropertyDescriptors(mod));
}

module.exports = merged;
