import { NavLink, useLocation } from 'react-router-dom';
import { Users, Shield, Archive } from 'lucide-react';

const navItems = [
  { to: '/', icon: Users, label: '群贤画册' },
  { to: '/clans', icon: Shield, label: '门派家族' },
  { to: '/backup', icon: Archive, label: '天道备份' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="w-56 min-h-screen nav-glass flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-paper-border">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏯</span>
          <div>
            <h1 className="text-sm font-bold text-divine-gold-600 tracking-wider">大荒天道</h1>
            <p className="text-[10px] text-ink-subtle tracking-wider">档案馆</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-5 px-3 space-y-0.5">
        {navItems.map(item => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                ${isActive
                  ? 'bg-divine-gold-500/10 text-divine-gold-600 font-medium'
                  : 'text-ink-subtle hover:text-ink hover:bg-paper-muted'
                }
              `}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-paper-border">
        <p className="text-[10px] text-ink-subtle text-center">
          大荒天道 · 仙侠人物档案
        </p>
      </div>
    </nav>
  );
}