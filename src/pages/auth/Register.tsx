import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password, firstName, lastName, role);
      toast.success('Registration successful! Please verify your email.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="first-name"
                label="First name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                fullWidth
              />
              
              <Input
                id="last-name"
                label="Last name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                fullWidth
              />
            </div>

            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />

            <Input
              id="confirm-password"
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`
                    border rounded-md p-4 cursor-pointer transition-colors
                    ${role === 'participant' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                  onClick={() => setRole('participant')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      checked={role === 'participant'}
                      onChange={() => setRole('participant')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label className="ml-2 block text-sm font-medium text-gray-700">
                      Participant
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    I want to join classes and learn
                  </p>
                </div>
                
                <div
                  className={`
                    border rounded-md p-4 cursor-pointer transition-colors
                    ${role === 'mentor' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                  onClick={() => setRole('mentor')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      checked={role === 'mentor'}
                      onChange={() => setRole('mentor')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label className="ml-2 block text-sm font-medium text-gray-700">
                      Mentor
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    I want to teach and create classes
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                icon={<UserPlus className="h-4 w-4" />}
              >
                Create account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}