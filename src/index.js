"use strict";

//see https://github.com/stylelint/stylelint/search?utf8=%E2%9C%93&q=plugin-array&type=
module.exports = [
    require("./property-requires-variable-value.js"),
    require("./color-requires-variable-value.js"),
    require("./fht-stylelint-comment-rule.js"),
    require("./fht-generic-stylelint-rule.js"),
    require("./fht-generic-stylelint-at-rule.js"),
    require("./stylelint-plugin-import"),
];
