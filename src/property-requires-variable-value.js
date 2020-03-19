"use strict";

//all stylelint utils see: https://github.com/stylelint/stylelint/tree/master/lib/utils

// Abbreviated example
const stylelint = require("stylelint")

const ruleName = "fht-rules/property-requires-variable-value"

const messages = stylelint.utils.ruleMessages(ruleName, {
    expected: "Please use variables defined in variables/_xxx.scss",
})

function isStringOrRegexOrPredicate(p) {
    return typeof p === 'string' ||
        Object.prototype.toString.call(p) == '[object RegExp]' ||
        typeof p === 'function'
}

function propertyMatches(p, value) {
    if (typeof p === 'string') return value === p;
    if (Object.prototype.toString.call(p) == '[object RegExp]') return p.test(value);
    if (typeof p === 'function') return p(value);
    return false;
}

function shouldIgnore(prop, value, ignores) {
    for(const ignore of ignores)
    {
        if(typeof ignore === 'string'){
            if(value === ignore){
                return true;
            }
        }
        else if (Object.prototype.toString.call(ignore) == '[object RegExp]'){
            if(ignore.test(value)){
                return true;
            }
        }
        else if (typeof ignore === 'function') {
            if(ignore(prop, value)){
                return true;
            }
        }
    }
    return false;
}

function ruleFunction(primaryOption, secondaryOptionObject) {
    // console.log("primaryOption", primaryOption)
    // console.log("secondaryOptionObject", secondaryOptionObject)
    var options = Array.isArray(primaryOption) ? primaryOption : [primaryOption]

    var ignores = secondaryOptionObject.ignores || [];

    return function (postcssRoot, postcssResult) {
        for (const option of options) {
            //see https://github.com/stylelint/stylelint/blob/f785cda12f700dcdff5cd740d111de0586f2c6a5/lib/utils/__tests__/validateOptions.test.js
            var validOptions = stylelint.utils.validateOptions(postcssResult,
                ruleName, {
                    actual: option,
                    possible: isStringOrRegexOrPredicate
                })

            if (!validOptions) {
                stylelint.utils.report({
                    result: postcssResult,
                    ruleName,
                    message: "primaryOption must be an string|regexp|predicateFunction, or an array of that",
                    node: postcssRoot
                });
                return
            }
        }
        // http://api.postcss.org/AtRule.html#walkDecls
        postcssRoot.walkDecls(decl => {
            if (decl.prop.startsWith("$")) {
                return;
            }
            // console.log(`${decl.prop} = ${decl.value}`)

            for (const option of options) {
                const matches = propertyMatches(option, decl.prop)
                var msg = stylelint.utils.ruleMessages(ruleName, {
                    expected: "`" + decl.prop + "` better refers to a variable defined in variables/_xyz.scss",
                })
                if (matches && !decl.value.startsWith("$") && !shouldIgnore(decl.prop, decl.value, ignores)) {
                    stylelint.utils.report({
                        message: msg.expected,
                        node: decl,
                        ruleName,
                        result: postcssResult
                    });
                    return
                }
            }
        })
    }
}

ruleFunction.primaryOptionArray = true

module.exports = stylelint.createPlugin(ruleName, ruleFunction)

//for testing, use https://github.com/simonsmith/stylelint-selector-bem-pattern/blob/master/test/index.js

module.exports.ruleName = ruleName
module.exports.messages = messages
