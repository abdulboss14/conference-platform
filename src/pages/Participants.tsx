import Layout from '../components/Layout';

export default function Participants() {
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Participants</h1>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-gray-500">View and manage participants for your classes.</p>
        </div>
      </div>
    </Layout>
  );
} 