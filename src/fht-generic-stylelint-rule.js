"use strict";

//all stylelint utils see: https://github.com/stylelint/stylelint/tree/master/lib/utils

// Abbreviated example
const stylelint = require("stylelint");

const ruleName = "fht-rules/fht-generic-stylelint-rule";

const messages = stylelint.utils.ruleMessages(ruleName, {
    rejected: "Invalid comment"
});

function ruleFunction(primaryOption) {
    return function (root, result) {
        const filePath = root.source.input.file;
        const sourceCode = root.source.input.css;
        const validOptions = stylelint.utils.validateOptions(result, ruleName, {
            actual: primaryOption,
            possible: opt => {
                if (opt && opt.validator && typeof(opt.validator) === "function") {
                    return true;
                }
                return false;
            }
        });
        if (!validOptions) return;

        const validator = primaryOption.validator;

        root.walkRules(rule => {
            try {
                validator(filePath, sourceCode, rule);
            }
            catch(err){
                stylelint.utils.report({
                    message: err.message,
                    node: rule,
                    result,
                    ruleName
                });
            }
        });
    }
}

ruleFunction.primaryOptionArray = true

module.exports = stylelint.createPlugin(ruleName, ruleFunction)

//for testing, use https://github.com/simonsmith/stylelint-selector-bem-pattern/blob/master/test/index.js

module.exports.ruleName = ruleName
module.exports.messages = messages
