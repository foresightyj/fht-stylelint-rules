//@ts-check

const stylelint = require("stylelint");
const testRule = require("stylelint-test-rule-tape");
const rule = require("./src/fht-generic-stylelint-rule");

testRule(rule.rule, {
    ruleName: rule.ruleName,
    config: {},
    accept: [
        { code: "/** @define Foo */ .Foo {}" },
        { code: "/** @define Foo */ .Foo-bar {}" },
    ],
    reject: [
        {
            code: "/** @define Foo */ .Foo_bar {}",
            message:
                'Invalid component selector ".Foo_bar" (' + rule.ruleName + ")",
            line: 1,
            column: 20,
        },
    ],
});
