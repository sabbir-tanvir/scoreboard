import { useEffect, useState } from "react";
import { AdminMatchBrowserPage } from "./pages/AdminMatchBrowserPage";
import { AdminMatchControllerPage } from "./pages/AdminMatchControllerPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { LivePage } from "./pages/LivePage";

function App() {
  const [path, setPath] = useState(window.location.pathname.toLowerCase());

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname.toLowerCase());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (path === "/" || path === "/live") {
    return <LivePage />;
  }

  if (path === "/admin" || path === "/admin/login") {
    return <AdminLoginPage />;
  }

  if (path === "/admin/dashboard") {
    return <AdminMatchBrowserPage />;
  }

  if (path === "/admin/controller") {
    return <AdminMatchControllerPage />;
  }

  return <LivePage />;
}

export default App;
