import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import "./styles/main.css";
import App from "./app";
import ErrorPage from "./layout/errorPage";
import Home from "./home";

const theme = createTheme({
  palette: {
    primary: { main: "#1565c0" }
  }
});

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [{ index: true, element: <Home /> }]
  }
]);

const container = document.getElementById("main");
if (!container) {
  throw new Error("The application root #main was not found.");
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
