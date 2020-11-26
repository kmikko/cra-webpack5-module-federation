const { appendWebpackPlugin } = require("@rescripts/utilities");
const { ModuleFederationPlugin } = require("webpack").container;
const packageJson = require("./package.json");

module.exports = (config) => {
  config.output.publicPath = `//${process.env.HOST}:${process.env.PORT}/`;
  return appendWebpackPlugin(
    new ModuleFederationPlugin({
      name: packageJson.name,
      library: { type: "var", name: packageJson.name },
      filename: "remoteEntry.js",
      exposes: {
        Header: "./src/components/Header",
      },
      shared: ["react", "react-dom", "react/jsx-dev-runtime"],
    }),
    config
  );

  return config;
};
