import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/landingpage/LandingPage";
import Authentication from "./components/authentication/Authentication";
import MainScreen from "./components/mainscreen/MainScreen";


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Authentication />} />
      <Route path="/main" element={<MainScreen />} />
    </Routes>
  );
}

export default App;