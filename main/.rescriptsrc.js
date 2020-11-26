const { appendWebpackPlugin, edit, getPaths } = require("@rescripts/utilities");
const { ModuleFederationPlugin } = require("webpack").container;

const loaderUtils = require("loader-utils");
const path = require("path");
const packageJson = require("./package.json");

const cssModuleRegex = /\.module\.css$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const cssModuleMatcher = (inQuestion) =>
  inQuestion &&
  inQuestion.test &&
  (inQuestion.test.toString() === sassModuleRegex.toString() ||
    inQuestion.test.toString() === cssModuleRegex.toString());

// https://github.com/facebook/create-react-app/blob/9b08e3c9b365ac790546a3d5027d24f264b42613/packages/react-dev-utils/getCSSModuleLocalIdent.js
// with package name from 'package.json' added to hash
// https://github.com/facebook/create-react-app/issues/9134
function getLocalIdent(context, localIdentName, localName, options) {
  const fileNameOrFolder = context.resourcePath.match(
    /index\.module\.(css|scss|sass)$/
  )
    ? "[folder]"
    : "[name]";
  const appName = packageJson.name;
  const hash = loaderUtils.getHashDigest(
    appName +
      path.posix.relative(context.rootContext, context.resourcePath) +
      localName,
    "md5",
    "base64",
    5
  );
  const className = loaderUtils.interpolateName(
    context,
    fileNameOrFolder + "_" + localName + "__" + hash,
    options
  );
  return className.replace(".module_", "_").replace(/\./g, "_");
}

const transformCssModule = (match) => {
  return {
    ...match,
    use: match.use.map((it) => {
      if (
        it.options &&
        it.options.modules &&
        it.options.modules.getLocalIdent
      ) {
        it.options.modules.getLocalIdent = getLocalIdent;
      }
      return it;
    }),
  };
};

module.exports = (config) => {
  config.output.publicPath = `//${process.env.HOST}:${process.env.PORT}/`;
  config = edit(transformCssModule, getPaths(cssModuleMatcher, config), config);
  config = appendWebpackPlugin(
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

  return config;
};
