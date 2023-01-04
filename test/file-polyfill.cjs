const {File, Blob} = require("web-file-polyfill");

global.File = File;
global.Blob = Blob;
