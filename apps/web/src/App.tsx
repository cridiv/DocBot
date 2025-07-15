import { Routes, Route } from "react-router-dom";
import DocBotUpload from "./pages/UploadPage";
import DocBotChat from "./pages/ChatPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DocBotUpload />} />
      <Route path="/chat" element={<DocBotChat />} />
    </Routes>
  );
}

export default App;
