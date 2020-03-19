"use strict";

//all stylelint utils see: https://github.com/stylelint/stylelint/tree/master/lib/utils

// Abbreviated example
const stylelint = require("stylelint")

const ruleName = "fht-rules/color-requires-variable-value"

const messages = stylelint.utils.ruleMessages(ruleName, {
    expected: "Please use variables defined in variables/_color.scss",
})

function valueContainsHexColor(value) {
    return /#[A-Fa-f0-9]{3,6}\b/.test(value)
}

function ruleFunction(primaryOption, secondaryOptionObject) {
    return function (postcssRoot, postcssResult) {
        // http://api.postcss.org/AtRule.html#walkDecls
        postcssRoot.walkDecls(decl => {
            if (decl.prop.startsWith("$")) {
                return;
            }
            // console.log(`${decl.prop} = ${decl.value}`)

            const hasHexColor = valueContainsHexColor(decl.value)
            var msg = stylelint.utils.ruleMessages(ruleName, {
                expected: "color in `" + decl.prop + "` should better refer to a variable in _colors.scss",
            })
            if (hasHexColor && !decl.value.includes("$")) {
                stylelint.utils.report({
                    message: msg.expected,
                    node: decl,
                    ruleName,
                    result: postcssResult
                });
                return
            }
        })
    }
}

ruleFunction.primaryOptionArray = true

module.exports = stylelint.createPlugin(ruleName, ruleFunction)

//for testing, use https://github.com/simonsmith/stylelint-selector-bem-pattern/blob/master/test/index.js

module.exports.ruleName = ruleName
module.exports.messages = messages
