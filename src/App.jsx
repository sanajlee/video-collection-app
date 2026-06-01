import { useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import RecordPage from "./pages/RecordPage.jsx";

export default function App() {
  const [page, setPage] = useState("home");

  if (page === "record") {
    return <RecordPage onBack={() => setPage("home")} />;
  }

  return <HomePage onStart={() => setPage("record")} />;
}