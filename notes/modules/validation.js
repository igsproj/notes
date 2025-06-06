const { ValidationError } = require("./errors.js");
const { validationResult } = require("express-validator");

const notesGet = {
  id: {
    in: ["query"],
    optional: true,
    isInt: true,
    // errorMessage: "custom message"
  },

  age: {
    in: ["query"],
    optional: true,
    isIn: { options: [["1month", "3months", "alltime", "archive"]] },
    // errorMessage: "custom message"
  },

  page: {
    in: ["query"],
    optional: true,
    isInt: true,
    // errorMessage: "custom message"
  },
};

const formatErr = (err) => {
  return `${err.location} ${err.type} "${err.path}" ${err.msg}`;
};

const validation = (req, res, next) => {
  const result = validationResult(req);
  const errors = result.array(/*{ onlyFirstError: true }*/);

  if (errors.length) return next(new ValidationError(formatErr(errors[0])));

  next();
};

module.exports = { validation, notesGet };
