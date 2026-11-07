# clean-start-typescript

A project generator for Node.js 26, React 19, Material UI 9, Express 5 and TypeScript 7, built with webpack 5. Both the client and Express service use strict TypeScript. Styling uses plain CSS and MUI's Emotion engine.

## Create a project

Use Node.js 26 and npm 12 or newer:

```sh
nvm install 26
nvm use 26
npx clean-start-typescript@latest my-app
cd my-app
npm run build
npm start
```

Open http://localhost:8080. The generator installs dependencies and creates a lockfile. Commit that lockfile; use `npm ci` for subsequent installations. `.nvmrc` and `.node-version` select Node 26, and `package.json` declares the supported Node and npm versions. Generated projects do not include an `.npmrc`; npm's engine enforcement policy remains under the developer's control. The generator itself requires Node 26.

The destination must not already exist. Paths containing spaces are supported. To create files without installing packages:

```sh
npx clean-start-typescript@latest my-app --skip-install
cd my-app
npm install
```

During setup, the CLI displays four numbered stages, completion times and live npm installation output. Successful setup ends with the project location and commands to build and start it. If installation fails, npm's error output remains visible and the CLI reports how to retry in the generated directory. `--skip-install` clearly marks installation as skipped.

Colors are enabled in interactive terminals and disabled for redirected output, `TERM=dumb`, or when `NO_COLOR` is set.

To try an unpublished checkout of the generator, use `node /absolute/path/to/clean-start-typescript/bin/csr.js my-app` instead of `npx`.

## Development

Run these in separate terminals:

```sh
# Express API on port 3000; Node 26 runs and watches TypeScript directly.
PORT=3000 npm run dev:server
```

```sh
# React application, hot reload and API proxy on port 8080.
npm run start:dev
```

The webpack development server proxies `/api` and `/about` to `http://localhost:3000`. Production serves the built React app and API from Express on one port. The starter uses hash routing, so client routes do not require an Express fallback.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build a development client bundle into `public/` |
| `npm run start:dev` | Start the webpack development server on port 8080 |
| `npm run dev:server` | Run and watch the TypeScript Express service |
| `npm run build` | Build the production client and compile the service |
| `npm run build:client` | Build the client into `public/`, with extracted CSS |
| `npm run build:server` | Compile the service into `dist/service/` |
| `npm start` | Run the compiled Express service; build first |
| `npm run typecheck` | Check the client, service and service tests |
| `npm test` | Run HTTP and configuration tests with Node's built-in test runner |
| `npm run clean` | Remove generated `public/` and `dist/` directories |
| `npm run reinstall` | Reinstall dependencies from the lockfile using `npm ci` |
| `npm run rebuild` | Clean, reinstall and build |

In the generator repository, `npm run test:generator` additionally verifies CLI scaffolding and error handling. It is not included in generated applications.

## Project structure

- `src/`: React components, router and MUI theme setup in `index.tsx`.
- `src/styles/main.css`: Plain CSS. MUI components can also use `sx` and the shared theme.
- `service/app.ts`: Express app factory, middleware, static files, `/about` and `/api/health`.
- `service/index.ts`: Service startup and optional clustering.
- `service/constants.ts`: Validated environment settings.
- `test/`: TypeScript service tests.
- `webpack.config.mjs`: TypeScript, CSS, favicon and asset handling.

SVG imports return asset URLs. Import `./icon.svg?component` to use an SVG as a React component. Webpack uses SWC to transpile TS/TSX, and production builds run TypeScript's type checker first. Babel and Sass are no longer required. Production uses compiled JavaScript; native Node TypeScript execution is used for development and tests, and does not replace `npm run typecheck`.

## Service configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port; use `3000` alongside webpack development |
| `WEB_CONCURRENCY` | `1` | Worker count; values above 1 enable Node clustering |
| `ALLOWED_ORIGINS` | Localhost origins on the service port, 8080 and 3000 | Comma-separated CORS allowlist |

Set `ALLOWED_ORIGINS` to the actual frontend origins when deploying across origins. The service uses Express's built-in body parsers and compression; `x-no-compression` disables compression for an individual request.

For a production deployment, run `npm ci && npm run build` during the build step. Ship `public/`, `dist/`, `package.json` and `package-lock.json`, install runtime packages with `npm ci --omit=dev`, and start with `npm start` under Node 26.
