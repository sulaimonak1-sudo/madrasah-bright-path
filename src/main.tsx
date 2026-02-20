import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("Service Worker registered successfully:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
} else {
  console.warn("Service Workers are not supported in this browser");
}

createRoot(document.getElementById("root")!).render(<App />);
