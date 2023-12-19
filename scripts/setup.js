const { readdirSync, writeFileSync } = require("fs");

const NPM_TOKEN = process.argv[2] || process.env.NPM_TOKEN || "${NPM_TOKEN}";

if (NPM_TOKEN) {
  const npmRcFileContent = `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`;
  const apps = readdirSync("./apps").filter((item) => !item.startsWith("."));

  writeFileSync(`./.npmrc`, npmRcFileContent);

  apps.forEach((package) => {
    writeFileSync(`./apps/${package}/.npmrc`, npmRcFileContent);
  });
}
