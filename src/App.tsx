// 文件名: src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { Home } from './pages/Home';

function App() {
  // 核心鉴权逻辑：从本地存储读取通行证名字 gem_token
  const isAuthenticated = !!localStorage.getItem('gem_token');

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 官网主页 */}
        <Route path="/" element={<Home />} />
        
        {/* 2. 身份认证路由 */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* 3. 受保护的内部仪表盘：未登录会强跳登录页 */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        
        {/* 4. 兜底路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;