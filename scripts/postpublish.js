/**
 * This script file will be executed AFTER the package is published
 * (before the `git push`)
 *
 * The following procedures are included:
 *
 * 1. Before this process, `dist/package.json` is updated with the new version
 *    and the updates should be synced to `package.json` and git,
 *    as described in [semantic-release/npm](https://github.com/semantic-release/npm#examples).
 *
 */

const { readFile, writeFile } = require("fs").promises;

const inputPkg = "dist/package.json";
const outputPkg = "package.json";

async function main() {
  const distPkg = await readFile(inputPkg, "utf-8");
  const { version } = JSON.parse(distPkg);
  if (!version || typeof version !== "string") {
    throw new Error(`version in ${inputPkg} is invalid: ${version}`);
  }

  const pkg = await readFile(outputPkg, "utf8");

  const newPkg = pkg.replace(
    /([{,]\s*"version"\s*:\s*)("[^"]+")(\s*[},])/,
    "$1" + JSON.stringify(version) + "$3",
  );

  await writeFile(outputPkg, newPkg);
}

main();
