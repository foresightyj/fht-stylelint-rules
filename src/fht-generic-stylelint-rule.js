//@ts-check

"use strict";

const assert = require("assert");

//all stylelint utils see: https://github.com/stylelint/stylelint/tree/master/lib/utils

/**
 * @typedef {import("postcss").Root} PostCssRoot
 * @typedef {import("postcss").Result} PostCssResult
 */

// Abbreviated example
const stylelint = require("stylelint");

const ruleName = "fht-rules/fht-generic-stylelint-rule";

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: "Invalid comment",
});

function ruleFunction(primaryOption) {
  /**
   * @param {PostCssRoot} root
   * @param {PostCssResult} result
   */
  function rule(root, result) {
    const filePath = root.source.input.file;
    const sourceCode = root.source.input.css;
    // @ts-ignore
    assert(typeof sourceCode === "string", "sourceCode is not string");
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: primaryOption,
      possible: (opt) => {
        if (opt && opt.validator && typeof opt.validator === "function") {
          return true;
        }
        return false;
      },
    });
    if (!validOptions) return;

    const validators = primaryOption.validators;
    // @ts-ignore
    assert(validators, "validators options is not defined");

    root.walkRules((rule) => {
      try {
        for (const validator of validators) {
          validator(filePath, sourceCode, rule);
        }
      } catch (err) {
        stylelint.utils.report({
          message: err.message,
          node: rule,
          result,
          ruleName,
        });
      }
    });
  }
  return rule;
}

ruleFunction.primaryOptionArray = true;

module.exports = stylelint.createPlugin(ruleName, ruleFunction);

//for testing, use https://github.com/simonsmith/stylelint-selector-bem-pattern/blob/master/test/index.js

module.exports.ruleName = ruleName;
module.exports.messages = messages;
