const {execSync} = require("child_process");
const fs = require("fs");

if (!fs.existsSync("./server/data/plugins/Thorium Default")) {
  console.info(
    execSync(
      'git clone https://github.com/thorium-sim/thorium-nova-plugin "server/data/plugins/Thorium Default"'
    ).toString()
  );
} else {
  console.info(
    execSync("git pull", {
      cwd: "./server/data/plugins/Thorium Default",
    }).toString()
  );
}
