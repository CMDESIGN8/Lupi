import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FutsalHub } from "./pages/FutsalHub";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {window.location.pathname.replace(/\/$/, "") === "/futsal" ? <FutsalHub /> : <App />}
  </React.StrictMode>
);