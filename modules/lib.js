const { createHash } = require("node:crypto");

const hash = (d, hashAlg = "sha256") => {
  const hashData = createHash(hashAlg);

  hashData.update(d);
  return hashData.digest("hex");
};

const isValidString = (str) => {
  return typeof str === "string" && str.length;
};

const isFunction = (func) => {
  return typeof func === "function";
};

const isError = (res) => {
  return res instanceof Error;
};

const runAsFunction = (func, defFunc = () => {}) => {
  return isFunction(func) ? func : defFunc;
};

const safeCallAsync = async (func, ...params) => {
  let res;
  try {
    res = await runAsFunction(func)(...params);
  } catch (err) {
    res = err;
  }

  return res;
};

const createQueryString = (params, prefix = "") => {
  let query = "";

  for (let key in params) {
    const value = String(params[key]);

    if (!isValidString(value)) continue;

    if (!query.length) query += `?${key}=${value}`;
    else query += `&${key}=${value}`;
  }

  return prefix + query;
};

module.exports = { hash, isValidString, isError, isFunction, runAsFunction, safeCallAsync, createQueryString };
