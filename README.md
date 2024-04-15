# clean-start-typescript
A Node Express Service using React with Typescript starter project

A simple clean webpack 5, babel, express.js, sass, React project setup for use.

`npx clean-start-react app-name` to create a base webpack/babel/sass/react setup into `app-name` folder.

## Basic setup

This project is a pre-configured setup for the common modern toolchains.  This config will only config the following libraries and tools:

* Webpack 5
* Babel
* SASS
* React 18
* Express.js
* Mocha
  * chai
  * jsdom

## Commands

The supported npm commands with this build are the following:

* npm run dev
  * build to dist and creates a separate css file and bundle.js
* npm run build
  * build to dist and creates a separate css file and bundle.js minified
* npm run rebuild
  * completely clears node_modules and rebuilds
* npm run reinstall
  * completely clears node_modules and installs
* npm test
  * runs babel and executes mocha against the test folder
* npm start
  * runs Express.js service
* npm run start:dev
  * runs webpack dev service
