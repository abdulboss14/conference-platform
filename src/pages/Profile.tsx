import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h1>
        {user && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                {user.first_name.charAt(0)}
                {user.last_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.first_name} {user.last_name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <p className="text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 