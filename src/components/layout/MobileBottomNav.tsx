import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target,
  Tag,
  BarChart2, 
  UserCircle, 
  Calendar,
  BookOpen,
  Users,
  DollarSign,
  ShieldAlert
} from 'lucide-react';

interface MobileBottomNavProps {
  userRole?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = userRole === 'admin' || userRole === 'super-admin';
  const isSuperAdmin = userRole === 'super-admin';

  const navItems = [
    {
      path: '/analytics',
      icon: LayoutDashboard,
      label: 'Dashboard',
      show: true
    },
    {
      path: '/role-plays',
      icon: Target,
      label: 'Training',
      show: true
    },
    {
      path: '/iq-agents',
      icon: UserCircle,
      label: 'Agents',
      show: true
    },
    {
      path: '/schedule',
      icon: Calendar,
      label: 'Schedule',
      show: true
    },
    {
      path: '/knowledge-base',
      icon: BookOpen,
      label: 'Knowledge',
      show: true
    },
    {
      path: '/roles',
      icon: Tag,
      label: 'Roles',
      show: isAdmin || isSuperAdmin
    },
    {
      path: '/pricing',
      icon: DollarSign,
      label: 'Pricing',
      show: isAdmin && !isSuperAdmin
    },
    {
      path: '/subscriptions',
      icon: DollarSign,
      label: 'Subs',
      show: isAdmin && !isSuperAdmin
    },
    {
      path: '/super-admin',
      icon: ShieldAlert,
      label: 'Super Admin',
      show: isSuperAdmin
    }
  ].filter(item => item.show);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-red-500/20 z-50 md:hidden shadow-2xl">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max px-3 py-2 space-x-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center min-w-[72px] px-2 py-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
                active
                  ? 'text-red-400 bg-red-500/20 shadow-lg cinematic-glow'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? 'text-red-400' : ''}`} />
              <span className={`text-xs font-medium leading-tight text-center whitespace-nowrap ${active ? 'text-red-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        </div>
      </div>
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};