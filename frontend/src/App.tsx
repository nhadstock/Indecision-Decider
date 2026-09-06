import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, PlusCircle, Filter } from 'lucide-react';
import DeciderWheel from './DeciderWheel';

interface Activity {
  id: number;
  name: string;
  cost: string;
  location: string;
  intensity: string;
  duration: number;
  season: string;
  spun_count: number;
} // <-- ADD THIS CLOSING BRACKET

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({
    name: '', cost: '$', location: 'Indoor', intensity: 'Low', duration: 60, season: 'Any'
  });
  
  // Filter States
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCost, setFilterCost] = useState<string>('');

  useEffect(() => {
    loadActivities();
  }, [filterLocation, filterCost]); // Reloads list automatically whenever filters change

  const loadActivities = async () => {
    try {
      // Build dynamic query parameters object for Axios
      const params: any = {};
      if (filterLocation) params.location = filterLocation;
      if (filterCost) params.cost = filterCost;

      const response = await axios.get('http://127.0.0.1:8000/activities/', { params });
      setActivities(response.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/activities/${id}`);
      loadActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/activities/', newActivity);
      setNewActivity({ name: '', cost: '$', location: 'Indoor', intensity: 'Low', duration: 60, season: 'Any' });
      loadActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="text-center pt-8 pb-4">
          <h1 className="text-3xl font-extrabold text-indigo-600">Activity Decider</h1>
          <p className="text-slate-500 text-sm mt-1">What are we doing today?</p>
        </header>

        {/* Creation Form */}
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-2">
          <input 
            type="text" 
            placeholder="e.g., Board Game Night" 
            required
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
            value={newActivity.name}
            onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
          />
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
            <PlusCircle size={20} />
          </button>
        </form>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter size={14} /> Filters
          </div>
          <div className="flex gap-2">
            <select 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              <option value="Indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>

            <select 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
              value={filterCost}
              onChange={(e) => setFilterCost(e.target.value)}
            >
              <option value="">All Costs</option>
              <option value="$">$ (Free/Cheap)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Splurge)</option>
            </select>
          </div>
        </div>

        {/* The Decider Wheel */}
        <DeciderWheel activities={activities} />

        {/* Activity List */}
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-center text-slate-400 italic py-4">No matching activities found.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{activity.name}</h3>
                  <div className="flex gap-2 text-xs text-slate-500 mt-2">
                    <span className="bg-slate-100 px-2 py-1 rounded-full">{activity.location}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-full">{activity.cost}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-full">{activity.duration}m</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(activity.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default App;