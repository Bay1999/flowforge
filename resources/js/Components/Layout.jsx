import { useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { LayoutDashboard, GitGraph, History, LogOut } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';

const Layout = ({ children }) => {
  const { user, loading, logout, hasRole } = useAuth();
  const { url } = usePage();

  useEffect(() => {
    if (!loading && !user) {
      router.visit('/login');
    }
  }, [user, loading]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/workflows', label: 'Workflows', icon: GitGraph },
    { path: '/runs', label: 'Run History', icon: History },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">FlowForge</h1>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = url === item.path || (item.path !== '/' && url.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col mb-4 px-2">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs font-medium text-gray-500 truncate">{user.email}</p>
            <div className="mt-1 flex gap-1 flex-wrap">
              {user.roles?.map(r => (
                 <span key={r.id} className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded-full">{r.name}</span>
              ))}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
