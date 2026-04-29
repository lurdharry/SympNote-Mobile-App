const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const pkgPath = path.join(__dirname, "..", "package.json");
const appJsonPath = path.join(__dirname, "..", "app.json");

function bump(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  if (type === "patch") return `${major}.${minor}.${patch + 1}`;
  throw new Error("Invalid bump type");
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    }),
  );
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const current = pkg.version;

  console.log(`\nCurrent version: ${current}\n`);
  console.log("  1) patch (bug fix)     →", bump(current, "patch"));
  console.log("  2) minor (new feature) →", bump(current, "minor"));
  console.log("  3) major (breaking)    →", bump(current, "major"));

  const answer = await prompt("\nSelect bump type (1/2/3): ");
  const typeMap = { 1: "patch", 2: "minor", 3: "major" };
  const type = typeMap[answer];

  if (!type) {
    console.log("Invalid choice. Aborting.");
    process.exit(1);
  }

  const next = bump(current, type);

  pkg.version = next;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  appJson.expo.version = next;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

  execSync(`git add package.json app.json`);
  execSync(`git commit -m "chore: bump version to ${next}"`);
  execSync(`git tag v${next}`);

  console.log(`\nBumped to ${next} (${type}). Don't forget: git push && git push --tags`);
}

main();
