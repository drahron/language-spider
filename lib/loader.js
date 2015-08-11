var packagePath = atom.packages.resolvePackagePath("language-spider")

require("traceur-runtime");
global.module_exports = undefined;
require(packagePath + "/lib/language-spider.js");
module.exports = module_exports;
