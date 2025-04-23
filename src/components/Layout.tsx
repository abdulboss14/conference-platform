import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, MessageSquare, User, Users, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isMentor = user?.role === 'mentor';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EduConnect</span>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    {user.first_name.charAt(0)}
                    {user.last_name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.first_name} {user.last_name}
                  </span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-grow flex">
        {user && (
          <nav className="bg-white w-64 border-r border-gray-200 pt-5 pb-4 flex flex-col">
            <div className="flex flex-col flex-grow px-4 space-y-1">
              <NavItem
                icon={<Calendar className="h-5 w-5" />}
                label="Dashboard"
                href="/dashboard"
              />
              {isMentor ? (
                <NavItem
                  icon={<BookOpen className="h-5 w-5" />}
                  label="My Classes"
                  href="/my-classes"
                />
              ) : (
                <NavItem
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Enrolled Classes"
                  href="/enrolled-classes"
                />
              )}
              {!isMentor && (
                <NavItem
                  icon={<Calendar className="h-5 w-5" />}
                  label="Explore Classes"
                  href="/explore"
                />
              )}
              <NavItem
                icon={<MessageSquare className="h-5 w-5" />}
                label="Messages"
                href="/messages"
              />
              <NavItem
                icon={<User className="h-5 w-5" />}
                label="Profile"
                href="/profile"
              />
              {isMentor && (
                <NavItem
                  icon={<Users className="h-5 w-5" />}
                  label="Participants"
                  href="/participants"
                />
              )}
            </div>
          </nav>
        )}
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
}

function NavItem({ icon, label, href }: NavItemProps) {
  const navigate = useNavigate();
  const isActive = window.location.pathname === href;
  
  return (
    <button
      onClick={() => navigate(href)}
      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group transition-colors duration-200 ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}