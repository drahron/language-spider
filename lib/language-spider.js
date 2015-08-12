$traceurRuntime.ModuleStore.getAnonymousModule(function() {
  "use strict";
  var CompositeDisposable = require("atom").CompositeDisposable;
  var path = require("path");
  var fs = require("fs");
  var exec = require("child_process").exec;
  var packagePath = atom.packages.resolvePackagePath("language-spider");
  var linterScript = packagePath + "/bin/linter.js";
  function compileSourceFile(filePath) {
    var useTempDirectory = arguments[1] !== (void 0) ? arguments[1] : false;
    var fileName = path.basename(filePath);
    var cwd = !useTempDirectory ? path.dirname(filePath) : "/tmp";
    if (useTempDirectory) {
      fs.writeFileSync("/tmp/" + fileName, fs.readFileSync(filePath));
    }
    var options = {cwd: cwd};
    var command = "spider -c --disable-source-map " + filePath;
    var promise = new Promise(function(resolve, reject) {
      exec(command, options, (function(error, stdout, stderr) {
        var result = {
          stdout: stdout,
          stderr: stderr,
          outputFile: cwd + "/" + path.basename(fileName, path.extname(fileName)) + ".js"
        };
        resolve(result);
      }));
    });
    return promise;
  }
  function parse(result, filePath) {
    if (!!result.stderr && !result.stdout) {
      return [{
        type: "Error",
        text: "Compilation failed.",
        html: result.stderr,
        range: [[0, 0], [0, 1]],
        filePath: filePath
      }];
    }
    var messages = [];
    var regex = /(?:\s*line\s+)(\d+)(?:\s+col\s+)(\d+)\s+(.+)(?:\n[^\^]+)([\^]+)/g;
    var match = null;
    while (match = regex.exec(result.stdout)) {
      var lineNumber = parseInt(match[1]) - 1;
      var firstCharacter = parseInt(match[2]) - 1;
      var length = match[4].length;
      messages.push({
        type: "Error",
        text: match[3],
        range: [[lineNumber, firstCharacter], [lineNumber, firstCharacter + length]],
        filePath: filePath
      });
    }
    return messages;
  }
  var lint = function(textEditor) {
    return $traceurRuntime.asyncWrap(function($ctx) {
      while (true)
        switch ($ctx.state) {
          case 0:
            $ctx.returnValue = new Promise(function(resolve, reject) {
              var result,
                  messages;
              return $traceurRuntime.asyncWrap(function($ctx) {
                while (true)
                  switch ($ctx.state) {
                    case 0:
                      Promise.resolve(compileSourceFile(textEditor.getPath(), !atom.config.get("language-spider.compileOnSave"))).then($ctx.createCallback(3), $ctx.errback);
                      return;
                    case 3:
                      result = $ctx.value;
                      $ctx.state = 2;
                      break;
                    case 2:
                      messages = parse(result, textEditor.getPath());
                      resolve(messages);
                      $ctx.state = -2;
                      break;
                    default:
                      return $ctx.end();
                  }
              }, this);
            });
            $ctx.state = 2;
            break;
          case 2:
            $ctx.state = -2;
            break;
          default:
            return $ctx.end();
        }
    }, this);
  };
  module_exports = {
    config: {compileOnSave: {
        type: "boolean",
        default: false
      }},
    activate: function(state) {},
    provideLinter: function() {
      return {
        grammarScopes: ["source.spider"],
        scope: "file",
        lintOnFly: false,
        lint: lint
      };
    }
  };
  return {};
});
