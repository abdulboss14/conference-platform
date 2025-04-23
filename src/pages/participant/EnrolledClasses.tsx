import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Class } from '../../types';
import Button from '../../components/Button';
import Layout from '../../components/Layout';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function EnrolledClasses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    async function fetchEnrolledClasses() {
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select('class:classes(*), created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform data to get just the classes
        const enrolledClasses = data.map(item => item.class) as Class[];
        setClasses(enrolledClasses);
      } catch (error) {
        console.error('Error fetching enrolled classes:', error);
        toast.error('Failed to load enrolled classes');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEnrolledClasses();
  }, [user]);

  const joinClass = (classId: string) => {
    navigate(`/class-session/${classId}`);
  };

  const unenrollFromClass = async (classId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to unenroll from this class?')) return;
    
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('user_id', user.id)
        .eq('class_id', classId);
      
      if (error) throw error;
      
      // Update local state
      setClasses(classes.filter(c => c.id !== classId));
      toast.success('Successfully unenrolled from class');
    } catch (error) {
      console.error('Error unenrolling from class:', error);
      toast.error('Failed to unenroll from class');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Enrolled Classes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your enrolled classes and attend sessions.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              onClick={() => navigate('/explore')}
              variant="outline"
            >
              Explore More Classes
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : classes.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {classes.map((classItem) => {
                const startDate = new Date(classItem.start_time);
                const endDate = new Date(classItem.end_time);
                const isUpcoming = startDate > new Date();
                const isInProgress = classItem.status === 'in_progress';
                const canJoin = isInProgress || 
                               (classItem.status === 'scheduled' && 
                                startDate <= new Date() && 
                                endDate >= new Date());
                
                return (
                  <li key={classItem.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Calendar className={`h-10 w-10 ${isInProgress ? 'text-green-500' : 'text-blue-500'}`} />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900 mr-2">
                                {classItem.title}
                              </h3>
                              {classItem.status === 'in_progress' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Live Now
                                </span>
                              )}
                              {classItem.status === 'cancelled' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Cancelled
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-500 line-clamp-1">
                              {classItem.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {format(startDate, 'MMM dd, yyyy - h:mm a')}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            {canJoin ? (
                              <Button
                                size="sm"
                                onClick={() => joinClass(classItem.id)}
                              >
                                Join Class
                              </Button>
                            ) : isUpcoming && classItem.status === 'scheduled' ? (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => unenrollFromClass(classItem.id)}
                              >
                                Unenroll
                              </Button>
                            ) : classItem.status === 'completed' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Completed
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No enrolled classes</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't enrolled in any classes yet.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/explore')}
              >
                Explore Classes
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}