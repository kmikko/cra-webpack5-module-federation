import React from "react";
import "./App.scss";

import Header from "./components/Header";
const Header1 = React.lazy(() => import("app1/Header"));
const Header2 = React.lazy(() => import("app2/Header"));

function App() {
  return (
    <div className="app">
      <Header />
      <React.Suspense fallback="Loading Header1">
        <Header1 />
      </React.Suspense>
      <React.Suspense fallback="Loading Header2">
        <Header2 />
      </React.Suspense>
    </div>
  );
}

export default App;
