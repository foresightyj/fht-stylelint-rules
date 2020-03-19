//@ts-check
"use strict";

//all stylelint utils see: https://github.com/stylelint/stylelint/tree/master/lib/utils

// Abbreviated example
const path = require('path');
const stylelint = require("stylelint");
const parser = require('postcss-selector-parser');

/**
 * @typedef {import("postcss").Root}  Root
 */

const ruleName = "fht-rules/fht-stylelint-comment-rule";

const messages = stylelint.utils.ruleMessages(ruleName, {
    rejected: "Invalid comment"
});

function ruleFunction(primaryOption) {
    return function (_root, result) {
        /** @type {Root} */
        const root = _root;

        const filePath = root.source.input.file;
        const sourceCode = root.source.input.css;

        let firstAtDefine;
        let hasDefinedBems = false;

        const stylelintBemDisables = [];

        root.walkComments(comment => {
            if (comment.raws.inline || comment.inline) {
                return;
            }

            if (comment.text && comment.text.length === 0) {
                return;
            }

            const report = msg => {
                stylelint.utils.report({
                    message: msg,
                    node: comment,
                    result,
                    ruleName
                });
            }

            if (comment.text.includes("stylelint-disable") && comment.text.includes("selector-bem-pattern")) {
                stylelintBemDisables.push(comment.text);
            }

            const tokens = comment.text.split(/\s+/);
            if (tokens[0].startsWith("stylelint-disable") && tokens.length === 1) {
                report(`使用${tokens[0]}时，请显式指定disable的规则，例如: /* ${tokens[0]} abc, xyz */`)
                return;
            }
            else if (((tokens[0] === "*@define") || (tokens[0] === "*" && tokens[1] == "@define")) && !firstAtDefine) {
                firstAtDefine = comment;
                hasDefinedBems = true;
                // if (comment.source.start.line > 1) {
                //     report(`第一个bem声明，必须放在第一行`);
                //     return;
                // }
                const firstNonCommentNodeInCss = comment.parent.nodes.find(n => n.type !== "comment");
                if (comment.source.start.line > firstNonCommentNodeInCss.source.start.line) {
                    // report(`第一个bem声明，必须放在第${firstNonCommentNodeInCss.source.start.line}行,现在是第${comment.source.start.line}`);
                    report(`第一个bem声明，必须放在第第一行`);
                    return;
                }
            }
            else {
                // console.log('tokens', tokens)
            }
        });

        const totalClassesInvolved = [];
        const processor = parser(node => {
            node.walkClasses(classNode => {
                const className = classNode._value;
                totalClassesInvolved.push(className);
            })
        });

        root.walkRules(rule => {
            // console.log('rule.selector', rule.selector);
            processor.processSync(rule.selector);
        });

        if (!hasDefinedBems && totalClassesInvolved.length && !filePath.includes("vendor")) {
            stylelint.utils.report({
                message: "此样式文件包含class样式定义，但一个BEM都没有定义",
                node: root,
                result,
                ruleName
            });
        }

        const maxStylelintDisablesPerFile = 10; //not more than this number of stylelint-disables of bem per file
        if (stylelintBemDisables.length > maxStylelintDisablesPerFile) {
            stylelint.utils.report({
                message: `使用${stylelintBemDisables.length}次stylelint-disable(selector-bem-pattern)，超过${maxStylelintDisablesPerFile}次就有点多了`,
                node: root,
                result,
                ruleName
            });
        }
    }
}

ruleFunction.primaryOptionArray = true

module.exports = stylelint.createPlugin(ruleName, ruleFunction)

//for testing, use https://github.com/simonsmith/stylelint-selector-bem-pattern/blob/master/test/index.js

module.exports.ruleName = ruleName
module.exports.messages = messages
