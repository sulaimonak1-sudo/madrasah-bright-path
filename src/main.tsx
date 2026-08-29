import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// No app-shell caching: always serve the latest deployed code.
// Any previously installed worker is unregistered and its caches cleared,
// so users get updates without clearing browser history.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations
      .filter((registration) => {
        const url = registration.active?.scriptURL || registration.installing?.scriptURL || "";
        return url.includes("/sw.js") || url.includes("/service-worker.js");
      })
      .forEach((registration) => registration.unregister());
  });

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("madrasah-")).map((key) => caches.delete(key)),
        ),
      );
  }
}

createRoot(document.getElementById("root")!).render(<App />);
