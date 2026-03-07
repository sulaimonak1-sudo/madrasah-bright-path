import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker only outside preview domains
const isPreviewHost = window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator && !isPreviewHost) {
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
} else if ("serviceWorker" in navigator) {
  // Cleanup stale workers/caches in preview to prevent stale chunk loading issues
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });

  if ("caches" in window) {
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
  }
}

createRoot(document.getElementById("root")!).render(<App />);
