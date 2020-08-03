const path = require("path");

module.exports = {
  rootDir: path.join(__dirname, ".."),
  moduleDirectories: ["node_modules", "./test"],
  moduleNameMapper: {
    "\\.css$": require.resolve("./styleMocker.js"),
    "^url:": require.resolve("./styleMocker.js"),
    "^three/examples/jsm/loaders/GLTFLoader": require.resolve(
      "./gltfLoader.js",
    ),
  },
};
