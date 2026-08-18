import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "@shopify/polaris";
import tr from "@shopify/polaris/locales/tr.json";
import "@shopify/polaris/build/esm/styles.css";
import App from "./App.jsx";
import HataSiniri from "./HataSiniri.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HataSiniri>
      <AppProvider i18n={tr}>
        <App />
      </AppProvider>
    </HataSiniri>
  </React.StrictMode>
);
