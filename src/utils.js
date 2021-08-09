//@ts-check
const assert = require('assert');

/**
 * @param {(string| RegExp| ((s:string)=>boolean))[] } ignores 
 */
function makeIgnorer(ignores) {
    assert(Array.isArray(ignores));
    /**
     * @param {string} filePath 
     * @returns {boolean}
     */
    function ignorer(filePath) {
        return ignores.some(ignore => {
            if (typeof ignore === "string") {
                return filePath.includes(ignore);
            } else if (typeof ignore === "function") {
                return ignore(filePath);
            } else if (Object.prototype.toString.call(ignore) == '[object RegExp]') {
                /** @type {RegExp} */
                const patt = ignore;
                return patt.test(filePath);
            }
        })
    }
    return ignorer;
}

module.exports = {
    makeIgnorer,
}