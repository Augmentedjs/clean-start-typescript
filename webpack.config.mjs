import path from "node:path";
import { fileURLToPath } from "node:url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import FaviconsWebpackPlugin from "favicons-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const root = path.dirname(fileURLToPath(import.meta.url));

export default (_env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    context: root,
    entry: "./src/index.tsx",
    target: "web",
    output: {
      clean: true,
      filename: isProduction ? "[name].[contenthash].js" : "[name].js",
      path: path.resolve(root, "public"),
      publicPath: "/"
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "swc-loader",
            options: {
              jsc: {
                parser: { syntax: "typescript", tsx: true },
                transform: { react: { runtime: "automatic" } },
                target: "es2023"
              }
            }
          }
        },
        {
          test: /\.svg$/i,
          oneOf: [
            { resourceQuery: /component/, use: ["@svgr/webpack"] },
            { type: "asset/resource" }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|webp|avif|ico|eot|ttf|otf|woff2?)$/i,
          type: "asset/resource"
        },
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            { loader: "css-loader", options: { sourceMap: !isProduction } }
          ]
        }
      ]
    },
    stats: "errors-warnings",
    devtool: isProduction ? false : "cheap-module-source-map",
    devServer: {
      static: { directory: path.resolve(root, "public") },
      compress: true,
      port: 8080,
      hot: true,
      proxy: [
        { context: ["/api", "/about"], target: "http://localhost:3000" }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({ template: "./src/index.html" }),
      new FaviconsWebpackPlugin({
        logo: "./src/images/elements.png",
        prefix: "images/",
        favicons: {
          icons: {
            android: false,
            appleIcon: false,
            appleStartup: false,
            favicons: true,
            windows: false,
            yandex: false
          }
        }
      }),
      ...(isProduction ? [new MiniCssExtractPlugin({ filename: "[name].[contenthash].css" })] : [])
    ]
  };
};
