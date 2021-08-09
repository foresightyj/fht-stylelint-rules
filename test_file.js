//@ts-check

const stylelint = require("stylelint");

const fs = require("fs");
const path = require("path");
const filePath = process.argv[2];

if (!filePath) {
    console.log("Usage: node test_file.js some_dir/some_scss_file.scss");
    process.exit(1);
}
if (!fs.existsSync(filePath)) {
    console.error(`Path does not exist: ${filePath}`);
    process.exit(1);
}

(async () => {
    const resultObject = await stylelint.lint({
        files: [filePath],
        config: {
            plugins: ["./src/index.js"],
            rules: {
                "fht-rules/fht-stylelint-comment-rule": [
                    true,
                    {
                        ignores: ["vendor"],
                    },
                ],
                "fht-rules/stylelint-plugin-import": [
                    true,
                    {
                        projectRoot: "D:\\Working\\FHT.Web",
                        webpackAlias: {
                            "@": path.resolve("D:\\Working\\FHT.Web\\src"),
                        },
                    },
                ],
            },
        },
    });
    if (resultObject.errored) {
        for (const result of resultObject.results) {
            for (const w of result.warnings) {
                console.log(w);
            }
        }
    }
})();
