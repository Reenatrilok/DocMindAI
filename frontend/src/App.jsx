import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MergePDF from "./pages/MergePDF";
import SplitPDF from "./pages/SplitPDF";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/merge" element={<MergePDF />} />
        <Route path="/split" element={<SplitPDF />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;