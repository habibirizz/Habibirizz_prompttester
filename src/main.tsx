import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AIProviderProvider } from "./context/AIProviderContext.tsx";
import { TabProvider } from "./context/TabContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
    <TabProvider>
      <AIProviderProvider>
        <App />
      </AIProviderProvider>
</TabProvider>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  </StrictMode>
);
0;
