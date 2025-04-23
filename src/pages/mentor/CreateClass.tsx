import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import toast from 'react-hot-toast';

export default function CreateClass() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a class');
      return;
    }
    
    if (!title || !description || !date || !startTime || !endTime) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Combine date and time into ISO strings
    const startDateTime = new Date(`${date}T${startTime}`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}`).toISOString();
    
    // Validate that end time is after start time
    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          title,
          description,
          mentor_id: user.id,
          start_time: startDateTime,
          end_time: endDateTime,
          status: 'scheduled',
        })
        .select();
      
      if (error) throw error;
      
      toast.success('Class created successfully!');
      navigate('/my-classes');
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error(error.message || 'Failed to create class');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Create a New Class
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Set up a new class for your students to join.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                id="title"
                label="Class Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introduction to Web Development"
                required
                fullWidth
                icon={<FileText className="h-5 w-5 text-gray-400" />}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of what will be covered in this class..."
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <Input
                  id="date"
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  fullWidth
                  icon={<Calendar className="h-5 w-5 text-gray-400" />}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Input
                  id="start-time"
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  fullWidth
                  icon={<Clock className="h-5 w-5 text-gray-400" />}
                />
              </div>

              <div>
                <Input
                  id="end-time"
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  fullWidth
                  icon={<Clock className="h-5 w-5 text-gray-400" />}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-4"
                onClick={() => navigate('/my-classes')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Create Class
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}