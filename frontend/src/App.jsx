import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Login from "./pages/Login";
import Schedule from "./pages/schedule";
import ScrollToTop from "./components/ScrollToTop";
import MyBookings from "./pages/MyBookings";
import AccountSettings from "./pages/AccountSettings";
import "./App.css";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/account-settings" element={<AccountSettings />}/>
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;