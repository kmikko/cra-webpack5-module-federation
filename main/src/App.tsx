import React from "react";
import "./App.css";

import Header from "./components/Header";
const Header1 = React.lazy(() => import("app1/Header"));

function App() {
  return (
    <div className="app">
      <Header />
      <React.Suspense fallback="Loading Header1">
        <Header1 />
      </React.Suspense>
    </div>
  );
}

export default App;
