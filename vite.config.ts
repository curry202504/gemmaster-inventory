import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 加载环境变量
    const env = loadEnv(mode, '.', '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0', // 允许局域网访问
        // 核心配置：反向代理
        proxy: {
          '/api': {
            target: 'http://localhost:3001', // 后端地址
            changeOrigin: true,
            secure: false,
            // 不需要 rewrite，因为后端路由本身就包含 /api
          }
        }
      },
      plugins: [react()],
      define: {
        // 注入环境变量供前端代码使用
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});