import React from "react";
import { createRoot } from "react-dom/client";
import "./standalone-ui.css";
import "@xyflow/react/dist/style.css";
import App from "./App.jsx";
import Embed from "./Embed.jsx";
import { isEmbedRequest } from "./embedMode.js";
import "./app.css";

const embed = isEmbedRequest(window.location.search);
createRoot(document.getElementById("root")).render(embed ? <Embed /> : <App />);
