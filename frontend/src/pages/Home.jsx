import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // 添加 useNavigate
import './Home.css';

const API_ROOT          = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/140/f0f0f0/666?text=Service';
const PRIORITY_SERVICES = ['Grooming', 'Vaccinations','Pain Management'];

/* ---------- 共同工具 ---------- */
const getImageUrl = (img) => {
  if (!img) return PLACEHOLDER_IMAGE;
  const url =
    img?.data?.attributes?.formats?.thumbnail?.url ||   // 1. thumbnail
    img?.data?.attributes?.url ||                      // 2. 原圖
    img?.url || '';                                    // 3. 最外層 url

  return url ? (url.startsWith('http') ? url : `${API_ROOT}${url}`) : PLACEHOLDER_IMAGE;
};

const normalizeService = (raw) => {
  const a = raw.attributes || raw;
  return {
    id:         raw.id,
    title:      a.title,
    duration:   a.duration,
    price:      a.price,
    bg:         a.backgroundColor ?? 'yellow',
    imageURL:   getImageUrl(a.image),
  };
};

const colorMap = { yellow:'#FFC785', red:'#FDAB9E', blue:'#AFDDFF' };
const bgColor  = (c='yellow') => colorMap[c.toLowerCase()] || colorMap.yellow;

/* ---------- Home ---------- */
export default function Home() {
  return (
    <div className="home">
      {/* === Hero === */}
      <section className="hero">
        <div className="hero-left">
          <h1>
            Premium support for your <br />
            <span className="highlight">Furry Friend.</span>
          </h1>
          <p>
            Discover a wide range of pet-care services tailored for your beloved companion.
            From grooming to vet visits, we are here to help you give your pet the love and
            attention they deserve.
          </p>
          <button className="learn-btn">Learn More</button>
        </div>
        <div className="hero-right">
          <img src="pet.png" alt="happy pet" />
        </div>
      </section>

      {/* === Why PetPals === */}
      <section className="features">
        <h2>Why PetPals?</h2>
        <div className="feature-list">
          <div className="feature-card">
            <img src="/community.png" alt="Community" />
            <h3>Pet Community</h3>
            <p>Connect with pet lovers and find local events and friends.</p>
          </div>
          <div className="feature-card">
            <img src="/service.png" alt="Services" />
            <h3>All-in-One Services</h3>
            <p>Book grooming, walking, sitting and more in one app.</p>
          </div>
          <div className="feature-card">
            <img src="/health.png" alt="Health" />
            <h3>Pet Health Tips</h3>
            <p>Get tailored health advice and wellness reminders.</p>
          </div>
        </div>
      </section>

      {/* === Top 3 Services === */}
      <FeaturedServices />
    </div>
  );
}

/* ---------- FeaturedServices ---------- */
function FeaturedServices() {
  const [raw, setRaw]   = useState([]);
  const [loading, setL] = useState(true);
  const navigate = useNavigate(); // 添加 navigate hook

  useEffect(() => {
    fetch(`${API_ROOT}/api/services?populate=image`)
      .then(r => r.json())
      .then(d => setRaw(Array.isArray(d) ? d : d.data ?? []))
      .catch(console.error)
      .finally(() => setL(false));
  }, []);

  /* 取出並排序前 3 名（Grooming / Dental Care / Vaccinations）*/
  const top3 = useMemo(() => {
    const all = raw.map(normalizeService);

    all.sort((a, b) => {
      const ai = PRIORITY_SERVICES.indexOf(a.title);
      const bi = PRIORITY_SERVICES.indexOf(b.title);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return all.slice(0, 3);
  }, [raw]);

  // 添加預約處理函數
  const handleBooking = (service) => {
    navigate('/schedule', { state: { selectedService: service } });
  };

  if (loading) {
    return (
      <section className="featured-services">
        <h2>Our Top Services</h2>
        <p style={{marginTop:32}}>Loading…</p>
      </section>
    );
  }

  return (
    <section className="featured-services">
      <h2>Our Top Services</h2>

      <div className="featured-list">
        {top3.map(s => (
          <div className="service-card" key={s.id}>
            <div className="service-image-container" style={{backgroundColor: bgColor(s.bg)}}>
              <div className="service-image-wrapper">
                <img
                  src={s.imageURL}
                  alt={s.title}
                  className="service-image loaded" 
                  onError={e => (e.currentTarget.src = PLACEHOLDER_IMAGE)}
                />
              </div>
            </div>

            <div className="service-card-bottom">
              <h3>{s.title}</h3>
              <p>{s.duration} min</p>
              <p>${s.price}</p>
              <button
                className="book-now-button"
                onClick={() => handleBooking(s)} // 修改為調用 handleBooking
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}