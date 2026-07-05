import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * 全局布局容器
 * 左侧竖条导航 + 右侧内容区
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}