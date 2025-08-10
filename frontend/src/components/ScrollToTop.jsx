// src/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  // 使用 useLocation hook 來獲取當前的路由信息
  const { pathname } = useLocation();

  // 使用 useEffect hook，並將 pathname 作為依賴項
  // 這意味著每當路徑名稱 (pathname) 發生變化時，這個 effect 就會重新運行
  useEffect(() => {
    // 執行滾動到頁面頂部的操作
    window.scrollTo(0, 0);
  }, [pathname]); // 依賴項數組，監聽 pathname 的變化

  // 這個組件不需要渲染任何可見的 UI，所以返回 null
  return null;
}

export default ScrollToTop;


