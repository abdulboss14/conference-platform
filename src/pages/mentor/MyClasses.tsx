import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, PlusCircle, Users, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Class, User, Enrollment } from '../../types';
import Button from '../../components/Button';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MyClasses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    async function fetchClasses() {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('mentor_id', user!.id)
          .order('start_time', { ascending: true });
        
        if (error) throw error;
        setClasses(data || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
        setClasses([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClasses();
  }, [user]);

  const startClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: 'in_progress' })
        .eq('id', classId);
      
      if (error) throw error;
      
      // Update local state
      setClasses(classes.map(c => 
        c.id === classId ? { ...c, status: 'in_progress' } : c
      ));
      
      // Navigate to the class session
      navigate(`/class-session/${classId}`);
    } catch (error) {
      console.error('Error starting class:', error);
      toast.error('Failed to start class');
    }
  };

  const cancelClass = async (classId: string) => {
    if (!confirm('Are you sure you want to cancel this class?')) return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: 'cancelled' })
        .eq('id', classId);
      
      if (error) throw error;
      
      // Update local state
      setClasses(classes.map(c => 
        c.id === classId ? { ...c, status: 'cancelled' } : c
      ));
      
      toast.success('Class cancelled successfully');
    } catch (error) {
      console.error('Error cancelling class:', error);
      toast.error('Failed to cancel class');
    }
  };

  const viewParticipants = async (classItem: Class) => {
    setSelectedClass(classItem);
    setIsLoadingParticipants(true);
    setIsParticipantsModalOpen(true);
    
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('user:profiles(*)')
        .eq('class_id', classItem.id);
      
      if (error) throw error;
      
      const enrollmentData = data as unknown as { user: User }[];
      const participantData = enrollmentData.map(item => item.user);
      setParticipants(participantData);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load participants');
      setParticipants([]);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Progress</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Classes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage all of your classes in one place.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              onClick={() => navigate('/create-class')}
              icon={<PlusCircle className="h-5 w-5" />}
            >
              Create New Class
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
                const canStart = classItem.status === 'scheduled' && 
                                startDate <= new Date() && 
                                endDate >= new Date();
                
                return (
                  <li key={classItem.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Calendar className="h-10 w-10 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900 mr-2">
                                {classItem.title}
                              </h3>
                              {getStatusBadge(classItem.status)}
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
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewParticipants(classItem)}
                              icon={<Users className="h-4 w-4" />}
                            >
                              Participants
                            </Button>
                            
                            {canStart ? (
                              <Button
                                size="sm"
                                onClick={() => startClass(classItem.id)}
                              >
                                Start Class
                              </Button>
                            ) : isUpcoming && classItem.status === 'scheduled' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/edit-class/${classItem.id}`)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => cancelClass(classItem.id)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : classItem.status === 'in_progress' ? (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/class-session/${classItem.id}`)}
                              >
                                Join Session
                              </Button>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new class.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/create-class')}
                icon={<PlusCircle className="h-5 w-5" />}
              >
                Create New Class
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Participants Modal */}
      <Modal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        title={`Participants - ${selectedClass?.title || ''}`}
      >
        {isLoadingParticipants ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
            ))}
          </div>
        ) : participants.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {participants.map(participant => (
              <li key={participant.id} className="py-3 flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {participant.first_name.charAt(0)}
                  {participant.last_name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {participant.first_name} {participant.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <Users className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No participants yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              No one has enrolled in this class yet.
            </p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}