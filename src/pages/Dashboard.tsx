import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Class } from '../types';
import Card from '../components/Card';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import VideoConference from '../components/VideoConference';

export default function Dashboard() {
  const { user } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    async function fetchClasses() {
      if (!user) return;
      
      try {
        let query;
        
        if (isMentor) {
          // Fetch classes created by this mentor
          query = supabase
            .from('classes')
            .select('*')
            .eq('mentor_id', user.id)
            .gt('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(3);
        } else {
          // Fetch classes this participant is enrolled in
          query = supabase
            .from('classes')
            .select('*, enrollments!inner(*)')
            .eq('enrollments.user_id', user.id)
            .gt('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(3);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setUpcomingClasses(data as Class[]);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClasses();
  }, [user, isMentor]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.first_name}! Here's what's happening today.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Video className="h-5 w-5 mr-2 text-blue-500" />
              Video Conference
            </h3>
            <VideoConference />
          </Card>

          <Card className="col-span-full lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Upcoming Classes
            </h3>
            
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-md p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : upcomingClasses.length > 0 ? (
              <div className="space-y-4">
                {upcomingClasses.map((classItem) => (
                  <div 
                    key={classItem.id} 
                    className="border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                      <p className="font-medium text-blue-800">{classItem.title}</p>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-sm text-gray-600">{classItem.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>
                          {format(new Date(classItem.start_time), 'MMM dd, yyyy - h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming classes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isMentor
                    ? "You haven't created any classes yet."
                    : "You're not enrolled in any upcoming classes."}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Activity Summary
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block h-8 w-12 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    upcomingClasses.length
                  )}
                </p>
              </div>
              
              {isMentor ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-500 mb-1">Completed Classes</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
