import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Class, Message, User } from '../types';
import Layout from '../components/Layout';
import Button from '../components/Button';
import toast from 'react-hot-toast';

export default function ClassSession() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    if (!id || !user) return;
    
    // Fetch class details
    async function fetchClassData() {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*, mentor:profiles(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setClassData(data as Class);
      } catch (error) {
        console.error('Error fetching class:', error);
        toast.error('Failed to load class data');
      } finally {
        setIsLoading(false);
      }
    }
    
    // Fetch messages
    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, user:profiles(*)')
          .eq('class_id', id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data as Message[]);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }
    
    // Fetch participants
    async function fetchParticipants() {
      try {
        // If user is mentor, fetch all enrolled participants
        if (isMentor) {
          const { data, error } = await supabase
            .from('enrollments')
            .select('user:profiles(*)')
            .eq('class_id', id);
          
          if (error) throw error;
          setParticipants(data.map(item => item.user) as User[]);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    }
    
    fetchClassData();
    fetchMessages();
    fetchParticipants();
    
    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `class_id=eq.${id}`
      }, (payload) => {
        // Fetch the user data for the new message
        const fetchUserForMessage = async () => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.user_id)
              .single();
            
            if (userError) throw userError;
            
            // Add the new message with user data
            setMessages(prev => [...prev, {
              ...payload.new as Message,
              user: userData as User
            }]);
            
            scrollToBottom();
          } catch (error) {
            console.error('Error fetching user for message:', error);
          }
        };
        
        fetchUserForMessage();
      })
      .subscribe();
    
    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [id, user, isMentor]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !id) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          class_id: id,
          user_id: user.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Clear input (the message will be added via the subscription)
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const endClass = async () => {
    if (!isMentor || !id) return;
    
    if (!confirm('Are you sure you want to end this class?')) return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: 'completed' })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Class completed successfully');
      // Update local state
      if (classData) {
        setClassData({ ...classData, status: 'completed' });
      }
    } catch (error) {
      console.error('Error ending class:', error);
      toast.error('Failed to end class');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!classData) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Class not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The class you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {classData.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isMentor ? 'You are hosting this class' : `Hosted by ${classData.mentor?.first_name} ${classData.mentor?.last_name}`}
              </p>
            </div>
            
            {isMentor && classData.status === 'in_progress' && (
              <Button
                variant="danger"
                onClick={endClass}
              >
                End Class
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg flex flex-col h-[calc(100vh-240px)]">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Live Chat
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.user_id === user?.id;
                      
                      return (
                        <div 
                          key={message.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`
                              max-w-xs lg:max-w-md px-4 py-2 rounded-lg 
                              ${isCurrentUser 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'bg-gray-100 text-gray-900'}
                            `}
                          >
                            {!isCurrentUser && (
                              <div className="font-medium text-xs text-gray-500 mb-1">
                                {message.user?.first_name} {message.user?.last_name}
                                {message.user?.role === 'mentor' && ' (Mentor)'}
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 text-sm">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={sendMessage} className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 min-w-0 appearance-none block px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <Button
                    type="submit"
                    className="ml-3"
                    disabled={!newMessage.trim()}
                    icon={<Send className="h-4 w-4" />}
                  >
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
          
          {isMentor && (
            <div className="md:col-span-1">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Participants
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {participants.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {participants.map((participant) => (
                        <li key={participant.id} className="py-3 flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {participant.first_name.charAt(0)}
                            {participant.last_name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {participant.first_name} {participant.last_name}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No participants have joined yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}