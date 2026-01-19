
import React from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import "./app/components/globals.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);
