import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error(error.message);
      } else {
        setIsSubmitted(true);
        toast.success('Password reset link sent to your email!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isSubmitted ? (
            <div className="text-center">
              <svg 
                className="mx-auto h-12 w-12 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Check your email</h3>
              <p className="mt-1 text-sm text-gray-500">
                We've sent a password reset link to {email}. Please check your inbox.
              </p>
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                >
                  Back to reset password
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
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

              <div>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  icon={<KeyRound className="h-4 w-4" />}
                >
                  Send reset link
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}