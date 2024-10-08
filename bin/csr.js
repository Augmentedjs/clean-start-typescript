#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const { exec } = require("child_process");

const packageJson = require("../package.json");

const scripts = 
 `"start": "node ./service/index.js",
  "dev": "webpack --mode development",
  "build": "webpack --mode production",
  "test": "mocha --require @babel/register --require test/helper.js -c test/*Spec.js",
  "clean": "rm -rf node_modules",
  "reinstall": "npm run clean && npm install",
  "rebuild": "npm run clean && npm install && npm run build",
  "start:dev": "webpack serve --mode development"`;

const license = `"license": "Apache-2.0"`;

const copyFolderSync = (from, to) => {
  fs.mkdirSync(to);
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
};

/**
 * we pass the object key dependency || devdependency to this function
 * @param {object} deps object key that we want to extract
 * @returns {string} a string of "dependencies@version"
 * that we can attach to an `npm i {value}` to install
 * every dep the exact version specified in package.json
 */
const getDeps = deps =>
  Object.entries(deps)
    .map(dep => `${dep[0]}@${dep[1]}`)
    .toString()
    .replace(/,/g, " ")
    .replace(/^/g, "")
    // exclude the plugin only used in this file, nor relevant to the boilerplate
    .replace(/fs-extra[^\s]+/g, "");

console.info("\x1b[34mInitializing project…\x1b[0m");

// create folder and initialize npm
exec(
  `mkdir ${process.argv[2]} && cd ${process.argv[2]} && npm init -f`,
  (initErr, initStdout, initStderr) => {
    if (initErr) {
      console.error(`\x1b[31mError: ${initErr}\x1b[0m`);
      return;
    }
    const packageJSON = `${process.argv[2]}/package.json`;
    // replace the default scripts, with the webpack scripts in package.json
    fs.readFile(packageJSON, (err, file) => {
      if (err) throw err;
      const data = file
        .toString()
        .replace(`"test": "echo \\"Error: no test specified\\" && exit 1"`, scripts)
        .replace(`"license": "Apache-2.0"`, license);
      fs.writeFile(packageJSON, data, err2 => err2 || true);
    });

    const filesToCopy = ["README.md", "webpack.config.mjs", "tsconfig.json", ".babelrc"];

    for (let i = 0; i < filesToCopy.length; i += 1) {
      fs.createReadStream(path.join(__dirname, `../${filesToCopy[i]}`))
        .pipe(fs.createWriteStream(`${process.argv[2]}/${filesToCopy[i]}`));
    }

    console.info("\x1b[37m • Fetching some files…\x1b[0m");

    // npm will remove the .gitignore file when the package is installed, therefore it cannot be copied
    // locally and needs to be downloaded.
    https.get(
      "https://raw.githubusercontent.com/Augmentedjs/clean-start-react/master/.gitignore",
      (res) => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", (data) => {
          body += data;
        });
        res.on("end", () => {
          fs.writeFile(`${process.argv[2]}/.gitignore`, body, { encoding: "utf-8" }, (err) => {
            if (err) throw err;
          });
        });
      },
    );

    console.info("\x1b[34mnpm init -- done!\x1b[0m");

    // installing dependencies
    console.info("\x1b[34mInstalling dependencies -- it might take a few minutes…\x1b[0m");
    const devDeps = getDeps(packageJson.devDependencies);
    const deps = getDeps(packageJson.dependencies);
    exec(
      `cd ${process.argv[2]} && npm i -D ${devDeps} && npm i -S ${deps}`,
      (npmErr, npmStdout, npmStderr) => {
        if (npmErr) {
          console.error(`\x1b[31mError ${npmErr}\x1b[0m`);
          return;
        }
        // console.info(npmStdout);
        console.info("\x1b[34mDependencies installed!\x1b[0m");

        try {
          console.info("\x1b[37m • Copying additional files…\x1b[0m");
          // copy additional source files
          console.info(`\x1b[37m • Copying source…\x1b[0m`);
          copyFolderSync(path.join(__dirname, "../src"), `${process.argv[2]}/src`);

          console.info(`\x1b[34mCopying tests…\x1b[0m`);
          copyFolderSync(path.join(__dirname, "../test"), `${process.argv[2]}/test`);

          console.info(`\x1b[34mCopying service…\x1b[0m`);
          copyFolderSync(path.join(__dirname, "../service"), `${process.argv[2]}/service`);

          console.info(`\x1b[1m\x1b[36mAll done!\nYour project is now started into ${process.argv[2]} folder,
            refer to the README for the project structure.\nMany thanks from Augmentedjs.com (https://www.augmentedjs.com)!\x1b[0m`);
        } catch(e) {
          console.error("\x1b[31mError\x1b[0m", e);
        }
      }
    );
  }
);
