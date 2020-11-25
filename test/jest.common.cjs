const path = require("path");

module.exports = {
  rootDir: path.join(__dirname, ".."),
  moduleDirectories: ["node_modules", "./test", "<rootDir>"],
  moduleNameMapper: {
    "^server/(.*)$": "<rootDir>/server/$1",
    "^client/(.*)$": "<rootDir>/client/$1",
    "\\.css$": require.resolve("./styleMocker.js"),
    "^url:": require.resolve("./styleMocker.js"),
    "^three/examples/jsm/(controls|loaders|objects|lines)/(DeviceOrientationControls|TrackballControls|OrbitControls|GLTFLoader|TransformControls|FlyControls|Sky|Reflector|LineGeometry|LineMaterial|Line2|DRACOLoader)": require.resolve(
      "./gltfLoader.js"
    ),
  },
};
