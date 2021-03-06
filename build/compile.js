var async, attachments, coffee, compile_attachment, compile_attachments, compile_coffee, compile_module, compile_modules, modules, path, spawn, utils;
async = require("async");
utils = require("kanso-utils/utils");
spawn = require("child_process").spawn;
path = require("path");
modules = require("kanso-utils/modules");
attachments = require("kanso-utils/attachments");
coffee = require("coffee-script/lib/coffee-script/coffee-script");
module.exports = {
  before: "properties",
  run: function(root, path, settings, doc, callback) {
    var apply_compile_attachments, apply_compile_modules, attach_paths, module_paths;
    if (!settings["coffee-script"]) {
      return callback(null, doc);
    }
    if (!settings["coffee-script"]["modules"] && !settings["coffee-script"]["attachments"]) {
      return callback(null, doc);
    }
    module_paths = settings["coffee-script"]["modules"] || [];
    if (!Array.isArray(module_paths)) {
      module_paths = [module_paths];
    }
    attach_paths = settings["coffee-script"]["attachments"] || [];
    if (!Array.isArray(attach_paths)) {
      attach_paths = [attach_paths];
    }
    apply_compile_modules = async.apply(compile_modules, doc, path);
    apply_compile_attachments = async.apply(compile_attachments, doc, path);
    return async.parallel([async.apply(async.forEach, module_paths, apply_compile_modules), async.apply(async.forEach, attach_paths, apply_compile_attachments)], function(err) {
      return callback(err, doc);
    });
  }
};
compile_modules = function(doc, path, paths, callback) {
  var pattern;
  pattern = /.*\.coffee$/i;
  return utils.find(utils.abspath(paths, path), pattern, function(err, data) {
    var apply_compile_module;
    if (err) {
      return callback(err);
    }
    apply_compile_module = async.apply(compile_module, doc, path);
    return async.forEach(data, apply_compile_module, callback);
  });
};
compile_module = function(doc, path, filename, callback) {
  var name;
  name = utils.relpath(filename, path).replace(/\.coffee$/, "");
  return compile_coffee(path, filename, function(err, js) {
    if (err) {
      return callback(err);
    }
    modules.add(doc, name, js.toString());
    return callback();
  });
};
compile_attachments = function(doc, path, paths, callback) {
  var pattern;
  pattern = /.*\.coffee$/i;
  return utils.find(utils.abspath(paths, path), pattern, function(err, data) {
    var apply_compile_attachment;
    if (err) {
      return callback(err);
    }
    apply_compile_attachment = async.apply(compile_attachment, doc, path);
    return async.forEach(data, apply_compile_attachment, callback);
  });
};
compile_attachment = function(doc, path, filename, callback) {
  var name;
  name = utils.relpath(filename, path).replace(/\.coffee$/, ".js");
  return compile_coffee(path, filename, function(err, js) {
    if (err) {
      return callback(err);
    }
    attachments.add(doc, name, name, new Buffer(js).toString("base64"));
    return callback();
  });
};
compile_coffee = function(project_path, filename, callback) {
  var c;
  console.log("Compiling " + utils.relpath(filename, project_path));
  c = coffee.compile(fs.readFileSync(filename, 'utf8'));
  return callback(null, c);
};