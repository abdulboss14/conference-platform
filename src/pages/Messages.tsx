import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/Button';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  class_id: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface Class {
  id: string;
  title: string;
  mentor_id: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    if (!user) return;

    // Fetch user's classes (either as mentor or participant)
    async function fetchClasses() {
      try {
        let query;
        if (isMentor) {
          query = supabase
            .from('classes')
            .select('id, title')
            .eq('mentor_id', user.id);
        } else {
          query = supabase
            .from('enrollments')
            .select('class:classes(id, title)')
            .eq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Type guard to handle different response shapes
        const classesData = isMentor 
          ? (data as Array<{ id: string; title: string }>)
          : (data as Array<{ class: { id: string; title: string } }>).map(item => item.class);
        
        setClasses(classesData);
        
        // Select the first class by default
        if (classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClasses();
  }, [user, isMentor]);

  useEffect(() => {
    if (!selectedClassId) return;

    // Fetch messages for selected class
    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, user:profiles(first_name, last_name, avatar_url)')
          .eq('class_id', selectedClassId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      }
    }

    fetchMessages();

    // Set up real-time subscription for messages
    const channel = supabase.channel(`messages:${selectedClassId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `class_id=eq.${selectedClassId}`
        },
        async (payload) => {
          // Fetch user data for the new message
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }

          const newMessage = {
            ...payload.new,
            user: userData
          } as Message;

          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      );

    // Start the subscription
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to messages channel!');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [selectedClassId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !selectedClassId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          class_id: selectedClassId,
          user_id: user.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-12rem)]">
        {/* Classes Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Classes</h2>
            <div className="space-y-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                    selectedClassId === cls.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {cls.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedClassId ? (
            <>
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.user_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.user_id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.user_id !== user?.id && (
                        <div className="text-xs font-medium mb-1">
                          {message.user?.first_name} {message.user?.last_name}
                        </div>
                      )}
                      <p>{message.content}</p>
                      <div
                        className={`text-xs mt-1 ${
                          message.user_id === user?.id
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={sendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">No class selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a class from the sidebar to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 