import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, PlusCircle, Filter, Edit2, Check, X } from 'lucide-react';
import DeciderWheel from './DeciderWheel';
import ReactSlider from 'react-slider';

interface Activity {
  id: number;
  name: string;
  cost: string;
  location: string;
  duration: number;
  season: string;
  include_group: string;
  physical_energy: string;
  mental_energy: string;
  spun_count: number;
} // <-- ADD THIS CLOSING BRACKET

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({
    name: '', cost: '$', location: 'Indoor', duration: 60, season: 'Any', include_group: 'No', physical_energy: 'Low', mental_energy: 'Low'
  });
  
  // Filter States
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterSeason, setFilterSeason] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  
  // Numerical ranges: Cost [0-3], Energy [0-2]
  const [costRange, setCostRange] = useState<[number, number]>([0, 3]);
  const [physicalRange, setPhysicalRange] = useState<[number, number]>([0, 2]);
  const [mentalRange, setMentalRange] = useState<[number, number]>([0, 2]);

  // Edit Mode State (The Staging Area)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'manage' | 'spin'>('manage');

  useEffect(() => {
    loadActivities();
  }, [filterLocation, filterSeason, filterGroup, costRange, physicalRange, mentalRange]);

const loadActivities = async () => {
    try {
      // Build dynamic query parameters object for Axios
      const params: any = {};
      if (filterLocation) params.location = filterLocation;
      if (filterSeason) params.season = filterSeason;
      if (filterGroup) params.include_group = filterGroup;
      
      // Map numerical slider values back to string arrays for the backend
      const costLabels = ['$', '$$', '$$$', '$$$$'];
      params.cost = costLabels.slice(costRange[0], costRange[1] + 1);
      
      const energyLabels = ['Low', 'Med', 'High'];
      params.physical_energy = energyLabels.slice(physicalRange[0], physicalRange[1] + 1);
      params.mental_energy = energyLabels.slice(mentalRange[0], mentalRange[1] + 1);

      // Tell Axios to serialize the arrays without brackets for FastAPI
      const response = await axios.get('http://127.0.0.1:8000/activities/', { 
        params,
        paramsSerializer: { indexes: null }
      });
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
      setNewActivity({ name: '', cost: '$', location: 'Indoor', duration: 60, season: 'Any', include_group: 'No', physical_energy: 'Low', mental_energy: 'Low' });
      loadActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
    }
  };

  // Triggers Edit Mode and copies data to staging
  const startEditing = (activity: Activity) => {
    setEditingId(activity.id);
    setEditForm({ ...activity });
  };

  // Pushes staged data to the backend and exits Edit Mode
  const handleEditSave = async () => {
    if (editingId === null) return;
    try {
      await axios.put(`http://127.0.0.1:8000/activities/${editingId}`, editForm);
      setEditingId(null);
      loadActivities();
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 font-sans text-slate-200">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="text-center pt-8 pb-4">
          <h1 className="text-3xl font-extrabold text-indigo-400">Activity Decider</h1>
          <p className="text-slate-400 text-sm mt-1">What are we doing today?</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-slate-800 p-1 rounded-xl shadow-lg border border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📋 Filter & Manage
          </button>
          <button
            onClick={() => setActiveTab('spin')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'spin' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🎡 Tie-Breaker
          </button>
        </div>

        {/* --- FILTER & MANAGE TAB --- */}
        {activeTab === 'manage' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Filter Bar (Moved Here!) */}
            <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">
                <Filter size={14} /> Filters
              </div>
              
              <div className="space-y-6">
                
                {/* Location & Season Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">📍 Location</span>
                    <div className="flex flex-wrap gap-2">
                      {['Indoor', 'Outdoor'].map(loc => (
                        <button key={loc} onClick={() => setFilterLocation(filterLocation === loc ? '' : loc)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${filterLocation === loc ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(79,70,229,0.7)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">⛅ Season</span>
                    <div className="flex flex-wrap gap-2">
                      {['Spring', 'Summer', 'Fall', 'Winter'].map(s => (
                        <button key={s} onClick={() => setFilterSeason(filterSeason === s ? '' : s)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${filterSeason === s ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(79,70,229,0.7)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Group Toggle */}
                <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">👥 Include Group?</span>
                    <div className="flex flex-wrap gap-2">
                      {['Yes', 'No'].map(g => (
                        <button key={g} onClick={() => setFilterGroup(filterGroup === g ? '' : g)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${filterGroup === g ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(79,70,229,0.7)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                </div>

                {/* The Sliders Row */}
                <div className="grid grid-cols-1 gap-8 pt-5 border-t border-slate-700">
                  
                  {/* Cost Range Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">💰 Cost Range</span>
                        <span className="text-xs font-bold text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">
                          {['$', '$$', '$$$', '$$$$'][costRange[0]]} - {['$', '$$', '$$$', '$$$$'][costRange[1]]}
                        </span>
                    </div>
                    <div className="px-2">
                      <ReactSlider
                        className="w-full h-2 flex items-center"
                        thumbClassName="w-5 h-5 bg-slate-200 border-2 border-indigo-500 rounded-full cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.8)] outline-none -mt-1.5"
                        trackClassName="h-2 rounded-full"
                        renderTrack={(props, state) => <div {...props} className={`${props.className} ${state.index === 1 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-900'}`} />}
                        min={0} max={3} step={1}
                        value={costRange}
                        onChange={(val) => setCostRange(val as [number, number])}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                      <span>$</span><span>$$</span><span>$$$</span><span>$$$$</span>
                    </div>
                  </div>

                  {/* Physical Energy Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">⚡ Physical Energy</span>
                        <span className="text-xs font-bold text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">
                          {['Low', 'Med', 'High'][physicalRange[0]]} - {['Low', 'Med', 'High'][physicalRange[1]]}
                        </span>
                    </div>
                    <div className="px-2">
                      <ReactSlider
                        className="w-full h-2 flex items-center"
                        thumbClassName="w-5 h-5 bg-slate-200 border-2 border-indigo-500 rounded-full cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.8)] outline-none -mt-1.5"
                        trackClassName="h-2 rounded-full"
                        renderTrack={(props, state) => <div {...props} className={`${props.className} ${state.index === 1 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-900'}`} />}
                        min={0} max={2} step={1}
                        value={physicalRange}
                        onChange={(val) => setPhysicalRange(val as [number, number])}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                      <span>Low</span><span>Med</span><span>High</span>
                    </div>
                  </div>

                  {/* Mental Energy Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🧠 Mental Energy</span>
                        <span className="text-xs font-bold text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">
                          {['Low', 'Med', 'High'][mentalRange[0]]} - {['Low', 'Med', 'High'][mentalRange[1]]}
                        </span>
                    </div>
                    <div className="px-2">
                      <ReactSlider
                        className="w-full h-2 flex items-center"
                        thumbClassName="w-5 h-5 bg-slate-200 border-2 border-indigo-500 rounded-full cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.8)] outline-none -mt-1.5"
                        trackClassName="h-2 rounded-full"
                        renderTrack={(props, state) => <div {...props} className={`${props.className} ${state.index === 1 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-900'}`} />}
                        min={0} max={2} step={1}
                        value={mentalRange}
                        onChange={(val) => setMentalRange(val as [number, number])}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                      <span>Low</span><span>Med</span><span>High</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Creation Form */}
            <form onSubmit={handleCreate} className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 flex gap-2">
              <input 
                type="text" 
                placeholder="e.g., Board Game Night" 
                required
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
                value={newActivity.name}
                onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
              />
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
                <PlusCircle size={20} />
              </button>
            </form>

            {/* Activity List */}
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center text-slate-400 italic py-4">No matching activities found.</p>
              ) : (
                activities.map((activity) => (
                  editingId === activity.id ? (
                    /* --- EDIT MODE --- */
                    <div key={activity.id} className="bg-slate-800 p-4 rounded-xl shadow-lg border border-indigo-500 space-y-3">
                      <input 
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                      />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})}>
                          <option>Indoor</option><option>Outdoor</option>
                        </select>
                        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})}>
                          <option>$</option><option>$$</option><option>$$$</option><option>$$$$</option>
                        </select>
                        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none" value={editForm.season} onChange={e => setEditForm({...editForm, season: e.target.value})}>
                          <option>Any</option><option>Spring</option><option>Summer</option><option>Fall</option><option>Winter</option>
                        </select>
                        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none" value={editForm.physical_energy} onChange={e => setEditForm({...editForm, physical_energy: e.target.value})}>
                          <option>Low</option><option>Med</option><option>High</option>
                        </select>
                        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none" value={editForm.mental_energy} onChange={e => setEditForm({...editForm, mental_energy: e.target.value})}>
                          <option>Low</option><option>Med</option><option>High</option>
                        </select>
                        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none" value={editForm.include_group} onChange={e => setEditForm({...editForm, include_group: e.target.value})}>
                          <option value="Yes">Group: Yes</option><option value="No">Group: No</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"><X size={18} /></button>
                        <button onClick={handleEditSave} className="p-2 text-green-400 hover:text-green-200 bg-green-900/30 hover:bg-green-800/50 rounded-full transition-colors"><Check size={18} /></button>
                      </div>
                    </div>
                  ) : (
                    /* --- VIEW MODE --- */
                    <div key={activity.id} className="bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-700 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-100">{activity.name}</h3>
                        <div className="flex gap-1">
                          <button onClick={() => startEditing(activity)} className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 rounded-full transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(activity.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-400">
                        <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">📍 {activity.location}</span>
                        <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">💰 {activity.cost}</span>
                        <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">⏳ {activity.duration}m</span>
                        <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">⛅ {activity.season}</span>
                        <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">👥 {activity.include_group}</span>
                        <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">⚡ {activity.physical_energy}</span>
                        <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full">🧠 {activity.mental_energy}</span>
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          </div>
        )}

        {/* --- TIE-BREAKER TAB --- */}
        {activeTab === 'spin' && (
          <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-xl font-bold text-slate-200">Let fate decide</h2>
              <p className="text-sm text-slate-400">Spinning from your filtered list of {activities.length} {activities.length === 1 ? 'activity' : 'activities'}</p>
            </div>
            {/* The Decider Wheel */}
            <DeciderWheel activities={activities} />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;