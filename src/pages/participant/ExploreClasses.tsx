import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Class } from '../../types';
import Button from '../../components/Button';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ExploreClasses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchClasses() {
      try {
        // Fetch all upcoming classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*, mentor:profiles(*)')
          .eq('status', 'scheduled')
          .gt('start_time', new Date().toISOString())
          .order('start_time', { ascending: true });
        
        if (classesError) throw classesError;
        
        // Fetch user's enrollments
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('user_id', user.id);
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Convert enrollments to a map for easy lookup
        const enrollmentMap: Record<string, boolean> = {};
        enrollmentsData.forEach(enrollment => {
          enrollmentMap[enrollment.class_id] = true;
        });
        
        setClasses(classesData as Class[]);
        setEnrollments(enrollmentMap);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClasses();
  }, [user]);

  const enrollInClass = async (classId: string) => {
    if (!user) {
      toast.error('You must be logged in to enroll in a class');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          class_id: classId,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update local state
      setEnrollments(prev => ({
        ...prev,
        [classId]: true
      }));
      
      toast.success('Successfully enrolled in class!');
    } catch (error) {
      console.error('Error enrolling in class:', error);
      toast.error('Failed to enroll in class');
    }
  };

  const filteredClasses = searchTerm
    ? classes.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${c.mentor?.first_name} ${c.mentor?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : classes;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Explore Classes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Discover and join upcoming classes from our mentors.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="max-w-lg w-full relative">
            <Input
              type="text"
              placeholder="Search classes by title, description, or mentor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <Card>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                </Card>
              </div>
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((classItem) => {
              const isEnrolled = enrollments[classItem.id];
              const startDate = new Date(classItem.start_time);
              
              return (
                <Card key={classItem.id}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {classItem.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                    {classItem.description}
                  </p>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{format(startDate, 'h:mm a')}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                        {classItem.mentor?.first_name.charAt(0)}
                        {classItem.mentor?.last_name.charAt(0)}
                      </div>
                      <span className="text-gray-700">
                        {classItem.mentor?.first_name} {classItem.mentor?.last_name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    {isEnrolled ? (
                      <Button
                        fullWidth
                        variant="outline"
                        disabled
                      >
                        Enrolled
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        onClick={() => enrollInClass(classItem.id)}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No matching classes found' : 'No classes available'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Check back later for newly scheduled classes'}
            </p>
            {searchTerm && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}