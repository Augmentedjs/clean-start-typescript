import React from "react";
import ReactDOM from "react-dom/client";

import {
  createHashRouter,
  RouterProvider
} from "react-router-dom";

import "./styles/main.scss";

import App from "./app";
import ErrorPage from "./layout/errorPage";
import Home from "./home";

// Router
const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <Home />
      }
    ]
  }
]);

const root = ReactDOM.createRoot(
  document.getElementById("main") as HTMLElement);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);