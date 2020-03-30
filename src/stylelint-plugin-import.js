//@ts-check

"use strict";

//all stylelint utils see: https://github.com/stylelint/stylelint/tree/master/lib/utils

/**
 * @typedef {import("postcss").Root} PostCssRoot
 * @typedef {import("postcss").Result} PostCssResult
 */

// Abbreviated example
const fs = require("fs");
const assert = require("assert");
const path = require("path");
const stylelint = require("stylelint");
const LRU = require("lru-cache");

const ruleName = "fht-rules/stylelint-plugin-import";

const messages = stylelint.utils.ruleMessages(ruleName, {
    expected: "Please use variables defined in variables/_color.scss",
});

const lru = new LRU({
    max: 1000,
    length: (v, k) => k.length + 10,
    maxAge: 20 * 1000,
});

/**
 * @param {string} path
 * @returns boolean
 */
function cachedFileExist(path) {
    const v = lru.get(path);
    if (typeof v !== "undefined") {
        return v;
    }
    const exists = fs.existsSync(path);
    lru.set(path, exists);
    return exists;
}

function ruleFunction(primaryOption, secondaryOptionObject) {
    /** @type {string} */
    const projectRoot = secondaryOptionObject.projectRoot;
    assert(projectRoot, "projectRoot is a required option");
    assert(typeof projectRoot === "string", "projectRoot is must be string");
    assert(
        path.isAbsolute(projectRoot),
        `projectRoot ${projectRoot} is not absolute path`,
    );
    assert(fs.existsSync(projectRoot), projectRoot + " does not exist");
    /** @type {{[k:string]:string}} */
    const webpackAlias = secondaryOptionObject.webpackAlias || {};
    for (const aliasKey of Object.keys(webpackAlias)) {
        assert(!aliasKey.endsWith("/"), "webpack alias should not end with /");
    }
    /**
     * @param {string} moduleImport
     * @return {string|undefined}
     */
    function mapAlias(moduleImport) {
        for (const aliasKey of Object.keys(webpackAlias)) {
            const aliasPrefix = aliasKey + "/";
            if (moduleImport.startsWith(aliasPrefix)) {
                const underlyingPath = path.join(
                    webpackAlias[aliasKey],
                    moduleImport.substr(aliasPrefix.length),
                );
                if (!path.isAbsolute(underlyingPath)) {
                    return path.join(projectRoot, underlyingPath);
                } else {
                    return underlyingPath;
                }
            }
        }
        return;
    }

    /**
     * @param {string} modulePath
     */
    function inferExtension(modulePath) {
        const hasExt = path.extname(modulePath) === ".scss";
        if (hasExt) {
            return modulePath;
        } else {
            const dirname = path.dirname(modulePath);
            const filename = path.basename(modulePath);
            return [
                path.join(dirname, `_${filename}.scss`),
                path.join(dirname, `${filename}.scss`),
            ];
        }
    }
    /**
     * @param {PostCssRoot} root
     * @param {PostCssResult} result
     */
    function rule(root, result) {
        const filePath = root.source.input.file;
        root.walkAtRules(rule => {
            if (rule.name === "import") {
                const moduleImport = JSON.parse(rule.params);
                const isRelative = moduleImport.startsWith(".");
                /** @type {string| string[]} */
                let modulePath;
                if (isRelative) {
                    modulePath = path.join(
                        path.dirname(filePath),
                        moduleImport,
                    );
                } else {
                    modulePath = mapAlias(moduleImport);
                }

                if (!modulePath) {
                    console.log(moduleImport, mapAlias(moduleImport));
                    stylelint.utils.report({
                        message: "impossible",
                        node: rule,
                        result,
                        ruleName,
                    });
                    return;
                } else {
                    modulePath = inferExtension(modulePath);
                    const possiblePaths = Array.isArray(modulePath)
                        ? modulePath
                        : [modulePath];
                    const found = possiblePaths.some(cachedFileExist);
                    if (!found) {
                        stylelint.utils.report({
                            message: `"${moduleImport}" does not exist in disk`,
                            node: rule,
                            result,
                            ruleName,
                        });
                    }
                }
            }
        });
        root.walkDecls(decl => {
            if (decl.value && decl.value.includes("url")) {
                const found = /\burl\s*\(\s*['"]?([^'"]+?)['"]?\s*\)/.exec(
                    decl.value,
                );
                assert(found, "failed to parse url in " + decl.value);
                const url = found[1];
                const isRelative = url.startsWith(".");
                /** @type {string} */
                let assetPath;
                if (isRelative) {
                    assetPath = path.join(path.dirname(filePath), url);
                } else {
                    if (!url.startsWith("~")) {
                        stylelint.utils.report({
                            message: "absolute import must start with ~",
                            node: decl,
                            result,
                            ruleName,
                        });
                        return;
                    } else {
                        const urlWithoutTilde = url.substr(1);
                        assetPath = mapAlias(urlWithoutTilde);
                    }
                }
                if (!assetPath) {
                    stylelint.utils.report({
                        message: "I cannot handle path: " + url,
                        node: decl,
                        result,
                        ruleName,
                    });
                } else {
                    const found = cachedFileExist(assetPath);
                    if (!found) {
                        stylelint.utils.report({
                            message: `${url} does not exist in disk`,
                            node: decl,
                            result,
                            ruleName,
                        });
                    }
                }
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
