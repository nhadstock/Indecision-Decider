import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, PlusCircle, Filter, Edit2, Check, X, CheckCircle2, BarChart2, RefreshCw, Settings, Download, Upload } from 'lucide-react';
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
  skipped_count: number;
  manual_pick_count: number;
  last_chosen_at: string | null;
}

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  
// Tab Navigation State
  const [activeTab, setActiveTab] = useState<'manage' | 'spin' | 'settings'>('manage');
  const [isUploading, setIsUploading] = useState(false);
  
  // Veto Modal State
  const [winningActivity, setWinningActivity] = useState<Activity | null>(null);

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
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/activities/${id}`);
      loadActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const handleChoose = async (id: number) => {
    try {
      await axios.post(`http://127.0.0.1:8000/activities/${id}/choose`);
      loadActivities();
    } catch (error) {
      console.error("Error choosing activity:", error);
    }
  };

  const handleSpinFinished = async (id: number) => {
    try {
      await axios.post(`http://127.0.0.1:8000/activities/${id}/spin`);
      // Find the winner to display in the modal
      const winner = activities.find(a => a.id === id);
      if (winner) setWinningActivity(winner);
      loadActivities();
    } catch (error) {
      console.error("Error logging spin:", error);
    }
  };

  const handleSkip = async (id: number) => {
    try {
      await axios.post(`http://127.0.0.1:8000/activities/${id}/skip`);
      setWinningActivity(null);
      loadActivities();
    } catch (error) {
      console.error("Error skipping activity:", error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("🚨 WARNING: This will permanently delete ALL activities. Are you absolutely sure?")) return;
    try {
      await axios.delete('http://127.0.0.1:8000/activities/clear-all');
      loadActivities();
    } catch (error) {
      console.error("Error clearing all activities:", error);
    }
  };

  const handleResetMetrics = async (id: number) => {
    if (!window.confirm("Are you sure you want to reset the stats for this activity?")) return;
    try {
      await axios.post(`http://127.0.0.1:8000/activities/${id}/reset-metrics`);
      loadActivities();
    } catch (error) {
      console.error("Error resetting metrics:", error);
    }
  };

  const handleExport = () => {
    // Simply opens the URL to trigger the browser's native file download
    window.open('http://127.0.0.1:8000/activities/export', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    
    // Package the file securely for FastAPI
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://127.0.0.1:8000/activities/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("CSV Imported Successfully!");
      loadActivities();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      alert("Failed to import CSV. Check your console for details.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input so you can re-upload the same file if needed
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.name.trim()) return;
    try {
      await axios.post('http://127.0.0.1:8000/activities/', newActivity);
      setNewActivity({ name: '', cost: '$', location: 'Indoor', duration: 60, season: 'Any', include_group: 'No', physical_energy: 'Low', mental_energy: 'Low' });
      setIsCreateModalOpen(false); // Close the modal upon success
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
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Settings size={16} /> Data
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

            {/* Add Activity Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 text-indigo-400 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} /> Add New Activity
            </button>

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
                        <div>
                          <h3 className="font-bold text-lg text-slate-100">{activity.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold tracking-wide">
                            <BarChart2 size={12} className="text-indigo-400" />
                            <span>Spun: {activity.spun_count || 0}</span> <span className="text-slate-600">|</span>
                            <span>Picked: {activity.manual_pick_count || 0}</span> <span className="text-slate-600">|</span>
                            <span>Skipped: {activity.skipped_count || 0}</span>
                            <button onClick={() => handleResetMetrics(activity.id)} className="ml-1 p-1 text-slate-500 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors" title="Reset Stats">
                              <RefreshCw size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleChoose(activity.id)} className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-full transition-colors" title="Select Activity"><CheckCircle2 size={18} /></button>
                          <button onClick={() => startEditing(activity)} className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 rounded-full transition-colors" title="Edit Activity"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(activity.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full transition-colors" title="Delete Activity"><Trash2 size={18} /></button>
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
              <DeciderWheel activities={activities} onSpinFinished={handleSpinFinished} />
            </div>
          )}

          {/* --- SETTINGS & DATA TAB --- */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700 space-y-6">
                
                <div>
                  <h2 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
                    <Download size={18} className="text-indigo-400" /> Export Data
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Download your full activity database (including all tracking metrics) as a CSV file.
                  </p>
                  <button 
                    onClick={handleExport}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download CSV
                  </button>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
                    <Upload size={18} className="text-indigo-400" /> Import Data
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Upload a CSV to bulk-add activities. Ensure your headers match the export format.
                  </p>
                  
                  {/* The hidden file input trick */}
                  <input 
                    type="file" 
                    accept=".csv" 
                    id="csv-upload" 
                    className="hidden" 
                    onChange={handleImport}
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="csv-upload"
                    className={`w-full bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600/40 text-indigo-300 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload size={16} /> {isUploading ? 'Uploading...' : 'Select CSV to Import'}
                  </label>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-red-900/30">
                  <h2 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                    <Trash2 size={18} /> Danger Zone
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    This action cannot be undone. It will wipe your entire database.
                  </p>
                  <button 
                    onClick={handleClearAll}
                    className="w-full bg-red-900/30 hover:bg-red-800/50 border border-red-500/50 text-red-400 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Clear All Activities
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      {/* --- CREATE MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-end md:items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-indigo-500 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-xl font-bold text-slate-100">Create Activity</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity Name</label>
                <input
                  type="text" required placeholder="e.g., Board Game Night"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</label>
                  <select className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors" value={newActivity.location} onChange={e => setNewActivity({...newActivity, location: e.target.value})}>
                    <option>Indoor</option><option>Outdoor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cost</label>
                  <select className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors" value={newActivity.cost} onChange={e => setNewActivity({...newActivity, cost: e.target.value})}>
                    <option>$</option><option>$$</option><option>$$$</option><option>$$$$</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Season</label>
                  <select className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors" value={newActivity.season} onChange={e => setNewActivity({...newActivity, season: e.target.value})}>
                    <option>Any</option><option>Spring</option><option>Summer</option><option>Fall</option><option>Winter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Group?</label>
                  <select className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors" value={newActivity.include_group} onChange={e => setNewActivity({...newActivity, include_group: e.target.value})}>
                    <option value="Yes">Yes</option><option value="No">No</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Physical Energy</label>
                  <select className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors" value={newActivity.physical_energy} onChange={e => setNewActivity({...newActivity, physical_energy: e.target.value})}>
                    <option>Low</option><option>Med</option><option>High</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mental Energy</label>
                  <select className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-2 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors" value={newActivity.mental_energy} onChange={e => setNewActivity({...newActivity, mental_energy: e.target.value})}>
                    <option>Low</option><option>Med</option><option>High</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
                Save Activity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- VETO MODAL --- */}
      {winningActivity && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-800 border-2 border-indigo-500 rounded-2xl p-8 w-full max-w-sm shadow-[0_0_30px_rgba(79,70,229,0.3)] text-center space-y-6">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">The Wheel Has Spoken!</h2>
            <p className="text-3xl font-extrabold text-white drop-shadow-md">{winningActivity.name}</p>
            
            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => {
                  handleChoose(winningActivity.id);
                  setWinningActivity(null);
                }} 
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/50 transition-all flex justify-center items-center gap-2 text-lg"
              >
                <CheckCircle2 size={24} /> Let's do it!
              </button>
              <button 
                onClick={() => handleSkip(winningActivity.id)}
                className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 text-lg"
              >
                <X size={24} /> Veto (Spin Again)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;