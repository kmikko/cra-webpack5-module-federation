const { appendWebpackPlugin } = require("@rescripts/utilities");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = (config) =>
  appendWebpackPlugin(
    new ModuleFederationPlugin({
      name: "main",
      remotes: {
        app1: "app1",
        app2: "app2",
      },
      shared: ["react", "react-dom", "react/jsx-dev-runtime"],
    }),
    config
  );
