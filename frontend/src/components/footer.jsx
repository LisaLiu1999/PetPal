// // src/footer.jsx

// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom';
// import { fetchServices } from '../services/strapi';
// import emailIcon from '../assets/mail.png'
// import phoneIcon from '../assets/phone.png';
// import mapIcon from '../assets/location.png';
// import './footer.css';

// const Footer = () => {
//   const [services, setServices] = useState([]);
//   const navigate = useNavigate();

//   // 取得服務列表（僅取前 5 筆）
//   useEffect(() => {
//     (async () => {
//       try {
//         const fetched = await fetchServices();
//         setServices(fetched.slice(0, 5));
//       } catch (err) {
//         console.error('Failed to load services for footer:', err);
//       }
//     })();
//   }, []);

//   // UPDATED: 點擊服務後直接導航，並將服務信息通過 state 傳遞
//   const handleServiceClick = (service) => {
//     // The ScrollToTop component will handle scrolling on the new page.
//     // We just need to navigate and pass the state.
//     navigate('/schedule', { state: { selectedService: service } });
//   };

//   return (
//     <footer className="footer">
//       <div className="footer-container">
//         {/* === Hero === */}
//         <div className="footer-hero">
//           <div className="footer-logo">
//             <img src="./petpallogo.svg" alt="PetPal logo" className="logo-img" />
//             <h1>PetPal</h1>
//           </div>

//           <p className="footer-description">
//             At PetPal, we provide expert, compassionate care to ensure your pets are happy,
//             healthy, and loved. Your furry friend's best friend.
//           </p>

//           <Link to="/Contact" className="appointment-btn">Get An Appointment</Link>
//         </div>

//         {/* === Main footer content === */}
//         <div className="footer-content">
//           {/* Company */}
//           <div className="footer-section">
//             <h3 className="section-title"><span className="paw-icon-small">🐾</span>Company</h3>
//             <ul className="footer-links">
//               <li><Link to="/">Home</Link></li>
//               <li><Link to="/contact">Contact Us</Link></li>
//               <li><Link to="/services">Our Services</Link></li>
//               <li><Link to="/login">Login</Link></li>
//             </ul>
//           </div>

//           {/* Services */}
//           <div className="footer-section">
//             <h3 className="section-title"><span className="paw-icon-small">🐾</span>Services</h3>
//             <ul className="footer-links">
//               {services.map((s) => (
//                 <li key={s.id}>
//                   {/* The button now correctly calls the simplified handler */}
//                   <button className="link-button" onClick={() => handleServiceClick(s)}>{s.title}</button>
//                 </li>
//               ))}
//               {services.length > 0 && <li><Link to="/services">All Services →</Link></li>}
//             </ul>
//           </div>

//           {/* Contact */}
//           <div className="footer-section">
//             <h3 className="section-title"><span className="paw-icon-small">🐾</span>Contact</h3>
//             <div className="contact-info">
//               <div className="contact-item">
//                 <img src={emailIcon} alt="Email" className="contact-icon-img" />
//                 <span>hellopetpal@company.com</span>
//               </div>
//               <div className="contact-item">
//                 <img src={phoneIcon} alt="Phone" className="contact-icon-img" />
//                 <span>+1 (555) 123-4567</span>
//               </div>
//               <div className="contact-item">
//                 <img src={mapIcon} alt="Location" className="contact-icon-img" />
//                 <span>
//                   1234 Furry Friends Avenue,
//                   <br />Petville, PA 19000
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

// src/footer.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { fetchServices } from '../services/strapi';
import emailIcon from '../assets/mail.png'
import phoneIcon from '../assets/phone.png';
import mapIcon from '../assets/location.png';
import './footer.css';

const Footer = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchServices();
        setServices(fetched.slice(0, 5));
      } catch (err) {
        console.error('Failed to load services for footer:', err);
      }
    })();
  }, []);

  // 修改這裡：在 navigate 之前加入 console.log
  const handleServiceClick = (service) => {
    // 加上這行來檢查 service 物件的內容
    console.log('準備導航，傳遞的服務資料是:', service); 
    
    navigate('/schedule', { state: { selectedService: service } });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* === Hero === */}
        <div className="footer-hero">
          <div className="footer-logo">
            <img src="./petpallogo.svg" alt="PetPal logo" className="logo-img" />
            <h1>PetPal</h1>
          </div>

          <p className="footer-description">
            At PetPal, we provide expert, compassionate care to ensure your pets are happy,
            healthy, and loved. Your furry friend's best friend.
          </p>

          <Link to="/Contact" className="appointment-btn">Get An Appointment</Link>
        </div>

        {/* === Main footer content === */}
        <div className="footer-content">
          {/* Company */}
          <div className="footer-section">
            <h3 className="section-title"><span className="paw-icon-small">🐾</span>Company</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/services">Our Services</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <h3 className="section-title"><span className="paw-icon-small">🐾</span>Services</h3>
            <ul className="footer-links">
              {services.map((s) => (
                <li key={s.id}>
                  <button className="link-button" onClick={() => handleServiceClick(s)}>{s.title}</button>
                </li>
              ))}
              {services.length > 0 && <li><Link to="/services">All Services →</Link></li>}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h3 className="section-title"><span className="paw-icon-small">🐾</span>Contact</h3>
            <div className="contact-info">
              <div className="contact-item">
                <img src={emailIcon} alt="Email" className="contact-icon-img" />
                <span>hellopetpal@company.com</span>
              </div>
              <div className="contact-item">
                <img src={phoneIcon} alt="Phone" className="contact-icon-img" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-item">
                <img src={mapIcon} alt="Location" className="contact-icon-img" />
                <span>
                  1234 Furry Friends Avenue,
                  <br />Petville, PA 19000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;