# Create React App &amp; Webpack 5 &amp; Module Federation

Webpack 5 introduced [Module Federation](https://webpack.js.org/concepts/module-federation/) that allows importing remote modules to your application. Practical use case for this is to have multiple separate Micro Frontends (buzzword alert) that are loaded from one main application.

## Usage
This repository consists of three (3) applications; one main application (`main`) and two microfrontends (`app1` and `app2`) which are stored in their respective directories.

To run the demo, first install dependencies by running `npm install` in each of the application's directory.  
Then to run the applications run `npm start` again in each of the application's directory.

Applications are then accesible from following URLs:

Application | URL
--- | ---
main | http://localhost:3000
app1 | http://localhost:3001
app2 | http://localhost:3002

The `main` application imports both of the microfrontends (`app1` and `app2`) and as such simulates a container/wrapper application.

## How did we get here
Create React App (CRA from here on) doesn't [yet](https://github.com/facebook/create-react-app/issues/9510) support Webpack 5 or Module Federation so getting all of this (seemingly) working requires few steps. This repo, besides providing a runnable demo application, aims to document that journey

### Getting started

This is mostly based on the modified [react-scripts](https://github.com/blackarctic/create-react-app/tree/webpack-5-react-scripts) by [blackarctic](https://github.com/blackarctic) so kudos to him.

Let's bootstrap our main application:
```
npx create-react-app main --template webpack-5-typescript --scripts-version webpack-5-react-scripts
```
This template also takes care of setting up the required [bootstrap file](https://webpack.js.org/concepts/module-federation/#troubleshooting) for Module Fedration to work.

Let's remove `main/node_modules` and check latest versions.
```
$ rm -rf node_modules
$ npm outdated
Package                      Current   Wanted    Latest  Location
@testing-library/jest-dom    MISSING   5.11.6    5.11.6  main
@testing-library/react       MISSING   11.2.2    11.2.2  main
@testing-library/user-event  MISSING   12.2.2    12.2.2  main
@types/jest                  MISSING  26.0.15   26.0.15  main
@types/node                  MISSING  12.19.7  14.14.10  main
@types/react                 MISSING  16.14.2    17.0.0  main
@types/react-dom             MISSING  16.9.10    17.0.0  main
react                        MISSING   17.0.1    17.0.1  main
react-dom                    MISSING   17.0.1    17.0.1  main
typescript                   MISSING    4.1.2     4.1.2  main
web-vitals                   MISSING    0.2.4     1.0.1  main
webpack-5-react-scripts      MISSING    0.8.0     0.8.0  main
```

Bleeding edge isn't bleeding edge without latest and greatest, so  
`main/package.json`
```diff
{
  ...,
  "dependencies": {
-    "@types/node": "^12.0.0",
+    "@types/node": "^14.14.10",
-    "@types/react": "^16.9.53",
+    "@types/react": "^17.0.0",
-    "@types/react-dom": "^16.9.8",
+    "@types/react-dom": "^17.0.0",
-    "web-vitals": "^0.2.4",
+    "web-vitals": "^1.0.1",
-    "typescript": "^4.0.3",
+    "typescript": "^4.1.2",
  },
  ...
}
```
```
npm install
```

I'm using VSCode and at the time of writing it's using [Typescript 4.0.2 for IntelliSense](https://github.com/facebook/create-react-app/issues/9868) which causes some ugly ESLint errors when opening `.tsx` files. To fix this open any `.tsx` file and start typing `>select typescript version` in `Command Palette` and from dropdown menu choose `Use Workspace Version`. Note, in order to get this working you need to add folder (`main` in this case) to your workspace using `Add Folder to Workspace...`, so don't just open the project root folder in VSCode.

Next we can try running the app
```
npm start
```
which should be then accessible from `http://localhost:3000`, great!

To get started with Module Federation we need to modify Webpack config. This could be done by ejecting CRA but then we would lose upgradeability among other things. Luckily there are [number](https://github.com/gsoft-inc/craco) [of](https://github.com/arackaf/customize-cra) [tools](https://github.com/timarney/react-app-rewired) to tackle this problem. I decided to go with [rescripts](https://github.com/harrysolovay/rescripts).

Let's install it
```
npm install @rescripts/cli --save-dev
```
and create configuration file for it  
```
main/.rescriptsrc.js
```
```js
const { appendWebpackPlugin } = require("@rescripts/utilities");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = (config) =>
  appendWebpackPlugin(
    new ModuleFederationPlugin({
      name: "main",
      library: { type: "var", name: "main" },
      filename: "remoteEntry.js",
      remotes: {
        app1: "app1",
        app2: "app2",
      },
      shared: ["react", "react-dom", "react/jsx-dev-runtime"],
    }),
    config
  );
```
>I'm not going into details what's going on here as there are numerous [blog](https://dev.to/brandonvilla21/micro-frontends-module-federation-with-webpack-5-426) [posts](https://blog.bitsrc.io/how-to-develop-microfrontends-using-react-step-by-step-guide-47ebb479cacd) that do better explaining it. Other good resources are Webpack's [documentation](https://webpack.js.org/concepts/module-federation) and [this repo](https://github.com/module-federation/module-federation-examples) with bunch of practical examples.

and replace `react-scripts` calls with `rescripts` calls in `package.json`
```diff
{
  ...,
  "scripts": {
-    "start": "react-scripts start",
+    "start": "rescripts start",
-    "build": "react-scripts build",
+    "build": "rescripts build",
-    "test": "react-scripts test",
+    "test": "rescripts test",
-    "eject": "react-scripts eject"
+    "eject": "rescripts eject"
  },
  ...
}
```

```sh
$ npm start

> main@0.1.0 start .../main
> rescripts start

internal/modules/cjs/loader.js:883
  throw err;
  ^

Error: Cannot find module 'react-scripts/config/paths'
```
but wait, that doesn't work? That's because `rescripts` expects to find `react-scripts` package but we're using modified `webpack-5-react-scripts` for Webpack 5 support. To work around this we can utilize npm package aliases.
```
main/package.json
```
```diff
{
  ...,
  "dependencies": {
    ...,
-    "webpack-5-react-scripts": "0.8.0"
+    "react-scripts": "npm:webpack-5-react-scripts@^0.8.0",
  },
  ...
}
```
And then run `npm install` again.  
We could have also installed `webpack-5-react-script` using the alias to begin with: `npm install react-scripts@npm:webpack-5-react-scripts@0.8.0`

Let's style our app a little.  
```main/src/App.tsx```
```tsx
import React from "react";
import "./App.css";

import Header from "./components/Header";

function App() {
  return (
    <div className="app">
      <Header />
    </div>
  );
}

export default App;
```
```main/src/App.css```
```css
.app {
  display: flex;
  flex-flow: column;
  height: 100vh;
}
```
```main/src/components/Header.tsx```
```tsx
import React from "react";
import "./Header.css";

const Header: React.FC = () => (
  <div className="block">
    <header className="header">Main app</header>
  </div>
);

export default Header;
```

```main/src/components/Header.css```
```css
.block {
  align-items: center;
  background-color: #282c34;
  display: flex;
  flex: 1;
  justify-content: center;
}

.header {
  color: white;
  font-size: calc(10px + 2vmin);
}
```

![Main app](https://user-images.githubusercontent.com/2776729/100371254-2e571100-3010-11eb-98f5-3145388d37e7.png)

### First Micro Frontend
Now we have a nice base for our app that we can utilize. Let's create our first child app by copying contents of `main`.

```sh
rsync -ar main/ app1 --exclude node_modules --exclude package-lock.json
```

Let's modify `name` of the app in `package.json`  
```diff
{
-  "name": "main",
+  "name": "app1",
  ...
}
```
and run `npm install`.

We want to run these apps in different ports and the easiest way to do this by controlling it from `.env` file. While we're at it let's also add one other useful parameter for later use.

```app1/.env```
```
HOST=localhost
PORT=3001
````

Next let's make few modifications to distinct `app1` from `main`.

```app1/components/Header.tsx```
```diff
const Header: React.FC = () => (
  <div className="block">
-    <header className="header">Main app</header>
+    <header className="header">App 1</header>
  </div>
);
```
```app1/components/Header.css```
```diff
.block {
  align-items: center;
-  background-color: #282c34;
+  background-color: #2a9d8f;
  display: flex;
  flex: 1;
  justify-content: center;
}
```

We can now run `app1` individually with `npm start` but we also want to be able to include it from our `main` app. To do this let's modify `app1/.rescriptsrc.js`
```js
const { appendWebpackPlugin } = require("@rescripts/utilities");
const { ModuleFederationPlugin } = require("webpack").container;

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
```

`Header` component of `app1` is now exposed via `http://localhost:3001/remoteEntry.js`

### Including app1 in main app
To use `app1/Header` in `main` app we need to do few modifications:

Include `remoteEntry.js` script in `index.html`

```main/public/index.html```
```diff
<!DOCTYPE html>
<html lang="en">
  <head>
    ...
+   <script src="http://localhost:3001/remoteEntry.js"></script>
    <title>React App</title>
  </head>
  ...
</html>
```

To dynamically import `Header` React provides us couple of useful tools, [lazy](https://reactjs.org/docs/react-api.html#reactlazy) and [Suspense](https://reactjs.org/docs/react-api.html#reactsuspense).

```
main/src/App.tsx
```
```diff
import React from "react";
import "./App.css";

import Header from "./components/Header";
+const Header1 = React.lazy(() => import("app1/Header"));

function App() {
  return (
    <div className="app">
      <Header />
+      <React.Suspense fallback="Loading Header1">
+        <Header1 />
+      </React.Suspense>
    </div>
  );
}

export default App;
```

To fix missing type declarations error of `app1/Header` we'll create a new file `app1.d.ts`.

```main/src/app1.d.ts```
```ts
/// <reference types="react" />

declare module "app1/Header" {
  const Header: React.ComponentType;

  export default Header;
}
```

Now when we run `npm start` in `main` folder and we can see header components of both `main` and `app1`!

![Main app and first Micro Frontend](https://user-images.githubusercontent.com/2776729/100371283-37e07900-3010-11eb-9080-995185abea69.png)

### But there's something wrong with the styles
Ok, so we can see both headers but they look the same?

This is because we have clashes in CSS class names, specifically `app1` overriding `.block` and `.header` style declarations of `main`. There are couple of options to fix this.

We could scope our CSS classes with application specific classname (like `.app1`) but that would require creating a wrapper component or adding extra class name to each element with existing class name definitions. Or we could import components to [Shadow Root](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) using something like [ReactShadow](https://github.com/Wildhoney/ReactShadow) but that would require some extra work in order to apply the styles too. But wait a minute, [CSS Modules](https://github.com/css-modules/css-modules) should solve this and they're supported by CRA out-of-the-box, great!


Just for the sake of it, let's also enable [Sass Stylesheets](https://sass-lang.com/) so we'll get some nice things for future developing.

```sh
$ npm install node-sass --save
```

To utilize Sass the only thing we then need to do is to change our stylesheet extentions (and imports) from `.css` to `.scss`. For CSS Modules (with [CRA](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet)) we would add `.module` suffix before `.scss` and slightly change how we import and apply our styles.

```app1/src/components/Header.tsx```
```diff
import React from "react";
-import "./Header.css";
+import styles from "./Header.module.scss";

const Header: React.FC = () => (
-  <div className="block">
+  <div className={styles.block}>
-    <header className="header">App 1</header>
+    <header className={styles.header}>App 1</header>
  </div>
);

export default Header;
```

But then on `npm start` we're greeted with `Failed to compile` error, wtf? This is because `react-scripts`, or in our case `webpack-5-react-scripts`, uses old version of `sass-loader` which [expects](https://github.com/webpack-contrib/sass-loader/issues/898) `node-sass@^4.0.0`. To work around this let's install the latest version before 5.0 instead:  
```
npm install node-sass@4.14.1
```

Next we have a problem with missing type declarations for our `Header.module.scss`. This is because styles are now imported as plain JavaScript objects and TypeScript is unable to perform typechecking. We could manually create type definitions for all of our CSS/SCSS modules as follows: 

```
Header.module.scss.d.ts
```
```ts
export const identifierName: string;
```

but that would get tedious after a while. Luckily there's [a plugin](https://github.com/mrmckeb/typescript-plugin-css-modules) to automate this!

```
$ npm install typescript-plugin-css-modules --save-dev
```
After installing we need to create a new file to store the style declarions.
```
app1/src/styles.d.ts
```
```ts
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
```

Finally we're able to run the `app1` again! Now let's make these same changes to `main` to enable CSS Modules and SASS there too.

After the changes both of the applications load but `main` still displays same background color for both of the headers. When we open dev tools and inspect the elements we can see the culprit. CSS Modules are in use as we can see from the hash in the class name but for some reason they are same for both of the headers. How is that possible? Shouldn't hash be always unqiue? 

![Dev Tools](https://user-images.githubusercontent.com/2776729/100371306-4038b400-3010-11eb-9f5b-413a3f187e87.png)

A bit of googling [reveals](https://github.com/facebook/create-react-app/issues/9134) that CRA uses relative filepath for classname generation and this is exactly the case with our `Header` components. It wasn't so straightforward after all, was it?


The issue lies deep in [getCSSModuleLocalIdent](https://github.com/facebook/create-react-app/blob/9b08e3c9b365ac790546a3d5027d24f264b42613/packages/react-dev-utils/getCSSModuleLocalIdent.js#L26) and there's no easy way to fix it. However as we're already fiddling with CRA's Webpack configuration we might go all in and try to do that anyway.

### Fixing getLocalIdent
What we want to achieve is to add some kind of project specific uniqueness to the hash to avoid collisions between components from different projects. Package name in `package.json` is a good candidate for this.

`getLocalIdent` is called from two module rules in Webpack's config [here](https://github.com/facebook/create-react-app/blob/9b08e3c9b365ac790546a3d5027d24f264b42613/packages/react-scripts/config/webpack.config.js#L533) and [here](https://github.com/facebook/create-react-app/blob/9b08e3c9b365ac790546a3d5027d24f264b42613/packages/react-scripts/config/webpack.config.js#L569). Luckily `rescripts` provides a [nice way](https://github.com/harrysolovay/rescripts#getpathspredicate-scantarget) to reference certain path in the config which should make it somewhat future proof. Easiest way to patch the method is to just completely replace it.

To do that we would use the [edit](https://github.com/harrysolovay/rescripts#edittransform-paths-config) method of `rescripts`
```js
edit(transformCssModule, getPaths(cssModuleMatcher, config), config)
```

We want to target both CSS and Sass modules so the matcher (`cssModuleMatcher`) would look like this:
```js
const cssModuleRegex = /\.module\.css$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const cssModuleMatcher = (inQuestion) =>
  inQuestion &&
  inQuestion.test &&
  (inQuestion.test.toString() === sassModuleRegex.toString() ||
    inQuestion.test.toString() === cssModuleRegex.toString());
```

and the transform (`transformCssModule`) method:
```js
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
``` 

finally the `getLocalIdent` would remain the [same](https://github.com/facebook/create-react-app/blob/9b08e3c9b365ac790546a3d5027d24f264b42613/packages/react-dev-utils/getCSSModuleLocalIdent.js) with the exception of adding name from `package.json` to the hash

```diff
const loaderUtils = require("loader-utils");
const path = require("path");
+const packageJson = require("./package.json");

function getLocalIdent(context, localIdentName, localName, options) {
  const fileNameOrFolder = context.resourcePath.match(
    /index\.module\.(css|scss|sass)$/
  )
    ? "[folder]"
    : "[name]";
+  const appName = packageJson.name;
  const hash = loaderUtils.getHashDigest(
+    appName +
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
```

Putting all these together should yield something like [this](https://github.com/kmikko/cra-webpack5-module-federation/blob/main/app1/.rescriptsrc.js).

Finally when we restart the applications we should see distinct header background colors!


### App2
Let's copy the codebase of `app1` and use it as a base for our `app2`
```sh
rsync -ar app1/ app2 --exclude node_modules --exclude package-lock.json
```

Make the usual tweaks

```package.json```
```diff
{
-  "name": "app1",
+  "name": "app2",
  ...
}
```

```.env```
```diff
HOST=localhost
-PORT=3001
+PORT=3002
```

```src/components/Header.tsx```
```diff
import React from "react";
import styles from "./Header.module.scss";

const Header: React.FC = () => (
  <div className={styles.block}>
-     <header className={styles.header}>App 1</header>
+    <header className={styles.header}>App 2</header>
  </div>
);

export default Header;
```

```app2/src/components/Header.module.scss```
```diff
.block {
  align-items: center;
-  background-color: #2a9d8f;
+  background-color: #f4a261;
  display: flex;
  flex: 1;
  justify-content: center;
}

.header {
  color: white;
  font-size: calc(10px + 2vmin);
}

```

and install and run it
```sh
npm install && npm start
```

And not to forget include it in our `main` app

```main/public/index.html```
```diff
<!DOCTYPE html>
<html lang="en">
  <head>
    ...
    <script src="http://localhost:3001/remoteEntry.js"></script>
+   <script src="http://localhost:3002/remoteEntry.js"></script>
    <title>React App</title>
  </head>
  ...
</html>
```

```main/src/app2.d.ts```
```
/// <reference types="react" />

declare module "app2/Header" {
  const Header: React.ComponentType;

  export default Header;
}
```

```main/src/App.tsx```
```diff
import React from "react";
import "./App.scss";

import Header from "./components/Header";
const Header1 = React.lazy(() => import("app1/Header"));
+const Header2 = React.lazy(() => import("app2/Header"));

function App() {
  return (
    <div className="app">
      <Header />
      <React.Suspense fallback="Loading Header1">
        <Header1 />
      </React.Suspense>
+     <React.Suspense fallback="Loading Header2">
+       <Header2 />
+     </React.Suspense>
    </div>
  );
}

export default App;
```

and ta-da! We now have two micro frontends being loaded from main app!

![Micro Frontends](https://user-images.githubusercontent.com/2776729/100371350-4e86d000-3010-11eb-88cf-4771da968bde.png)