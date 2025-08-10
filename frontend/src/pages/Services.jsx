// src/pages/Services.jsx - 修復版本
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Services.css'

const API_URL = 'http://localhost:1337'; // 或您的實際 API URL
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/140/f0f0f0/666?text=Service';

const FALLBACK_SERVICES = [
  {
    id: -1,
    title: 'Dental Care',
    duration: 30,
    price: 45,
    backgroundColor: 'yellow',
    image: { url: '/mock/dental.jpg' },
  },
  {
    id: -2,
    title: 'Vaccination',
    duration: 15,
    price: 30,
    backgroundColor: 'red',
    image: { url: '/mock/vaccine.jpg' },
  },
  {
    id: -3,
    title: 'Grooming',
    duration: 40,
    price: 60,
    backgroundColor: 'blue',
    image: { url: '/mock/grooming.jpg' },
  }
];

// 修復圖片 URL 處理
const getImageUrl = (img) => {
  if (!img) return PLACEHOLDER_IMAGE;
  
  // 處理不同的圖片數據結構
  const url = 
    img?.data?.attributes?.formats?.thumbnail?.url ||   // Strapi v4 結構
    img?.data?.attributes?.url ||                      // Strapi v4 原圖
    img?.url ||                                        // 直接 URL
    '';

  if (!url) return PLACEHOLDER_IMAGE;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
};

// 統一服務數據結構
const normalizeService = (raw) => {
  const attributes = raw.attributes || raw;
  
  return {
    id: raw.id || attributes.id,
    title: attributes.title || 'Untitled Service',
    duration: Number(attributes.duration) || 0,
    price: Number(attributes.price) || 0,
    backgroundColor: (attributes.backgroundColor || 'yellow').toLowerCase(),
    imageURL: getImageUrl(attributes.image),
  };
};

// 獲取背景色
const getBackgroundColor = (color = 'yellow') => {
  const colorMap = {
    yellow: '#FFC785',
    red: '#FDAB9E', 
    blue: '#AFDDFF'
  };
  return colorMap[color.toLowerCase()] || colorMap.yellow;
};

// 圖片加載狀態 Hook
const useImgStatus = (url) => {
  const [status, setStatus] = useState('loading');
  const timer = useRef();

  useEffect(() => {
    if (!url || url === PLACEHOLDER_IMAGE) {
      setStatus('loaded');
      return;
    }
    
    const img = new Image();
    
    // 5秒超時
    timer.current = setTimeout(() => {
      setStatus('error');
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timer.current);
      setStatus('loaded');
    };
    
    img.onerror = () => {
      clearTimeout(timer.current);
      setStatus('error');
    };
    
    img.src = url;
    
    return () => clearTimeout(timer.current);
  }, [url]);

  return status;
};

// 骨架屏組件
const CardSkeleton = () => (
  <div className="service-card skeleton">
    <div className="service-image-container skeleton-shimmer">
      <div className="service-image-wrapper">
        <div className="skeleton-circle" />
      </div>
    </div>
    <div className="service-content">
      <div className="skeleton-text skeleton-title" />
      <div className="skeleton-text skeleton-meta" />
      <div className="skeleton-text skeleton-price" />
      <div className="skeleton-button" />
    </div>
  </div>
);

// 服務卡片組件
const ServiceCard = ({ service, onSelect }) => {
  const imgStatus = useImgStatus(service.imageURL);
  const src = imgStatus === 'error' ? PLACEHOLDER_IMAGE : service.imageURL;
  const bgColor = getBackgroundColor(service.backgroundColor);

  return (
    <div className="service-card">
      <div 
        className="service-image-container" 
        style={{ backgroundColor: bgColor }}
      >
        <div className="service-image-wrapper">
          {imgStatus === 'loading' && (
            <div className="image-loading-spinner">
              <div className="spinner" />
            </div>
          )}
          <img
            src={src}
            alt={service.title}
            className={`service-image ${imgStatus === 'loaded' ? 'loaded' : ''}`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>
      </div>
      
      <div className="service-content">
        <h3 className="service-title">{service.title}</h3>
        <p className="service-meta">{service.duration} min</p>
        <p className="service-price">${service.price}</p>
        <button 
          className="book-now-button" 
          onClick={() => onSelect(service)}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

// 獲取服務數據
const fetchServices = async () => {
  try {
    const response = await fetch(`${API_URL}/api/services?populate=*`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

// 主組件
export default function Services() {
  const [rawServices, setRawServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const retryTimer = useRef();

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchServices();
      setRawServices(data);
      setRetryCount(0);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError(err);
      
      // 自動重試機制（最多3次）
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 指數退避
        retryTimer.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadServices();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    return () => clearTimeout(retryTimer.current);
  }, []);

  // 使用實際數據或回退數據
  const services = rawServices.length > 0 
    ? rawServices.map(normalizeService)
    : FALLBACK_SERVICES.map(normalizeService);

  const handleSelectService = (service) => {
    navigate('/schedule', { 
      state: { 
        service: service,
        selectedService: service // 為了兼容性添加兩個字段
      } 
    });
  };

  const handleRetry = () => {
    setRetryCount(0);
    loadServices();
  };

  return (
    <div className="page-content">
      <h1>Pet Pal Services</h1>
      
      {loading && (
        <div className="services-container">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      
      {!loading && (
        <div className="services-container">
          {services.map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onSelect={handleSelectService} 
            />
          ))}
        </div>
      )}
      
      {error && !loading && (
        <div className="error-container">
          <div className="error-message">
            ⚠️ Failed to load services: {error.message}
          </div>
          <button className="retry-button" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}