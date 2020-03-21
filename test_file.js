//@ts-check

const stylelint = require('stylelint');

const path = process.argv[2];

(async () => {
    const resultObject = await stylelint.lint({
        files: [path],
        config: {
            plugins: [
                "./src/index.js"
            ],
            rules: {
                "fht-rules/fht-stylelint-comment-rule": [true, {
                    ignores: ['vendor'],
                }],
            }
        }
    });
    if (resultObject.errored) {
        for (const result of resultObject.results) {
            for (const w of result.warnings) {
                console.log(w);
            }
        }
    }
})();
