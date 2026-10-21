import React from "react";
import { createRoot } from "react-dom/client";
import "@xyflow/react/dist/style.css";
import App from "./App.jsx";
import Embed from "./Embed.jsx";
import "./app.css";

const embed = new URLSearchParams(window.location.search).get("embed") === "1";
createRoot(document.getElementById("root")).render(embed ? <Embed /> : <App />);
