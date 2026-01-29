import { useState } from 'react';
import { 
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut, 
  Menu, 
  X,
  Stethoscope,
  Dumbbell,
  Apple
} from 'lucide-react';
import DoctorOverview from './DoctorOverview';
import DoctorPatients from './DoctorPatients';
import DoctorExercises from './DoctorExercises';
import DoctorDiet from './DoctorDiet';
import DoctorProgress from './DoctorProgress';
import { User } from '@/lib/auth';

interface DoctorDashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function DoctorDashboard({ user, onLogout }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'exercises', label: 'Exercise Assignment', icon: Dumbbell },
    { id: 'diet', label: 'Diet Plans', icon: Apple },
    { id: 'reports', label: 'Reports', icon: ClipboardList },
  ];

  const handlePatientSelect = (patientId: number) => {
    setSelectedPatientId(patientId);
    setActiveTab('exercises');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans transition-colors duration-300">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1e293b] shadow-xl z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 border-r border-slate-800`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Doctor Portal</h2>
              <p className="text-xs text-slate-400 truncate max-w-[120px]">
                {user?.name || 'Doctor'}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'dashboard' && <DoctorOverview doctorId={user?.id} onPatientSelect={handlePatientSelect} />}
          {activeTab === 'patients' && <DoctorPatients doctorId={user?.id} />}
          {activeTab === 'exercises' && <DoctorExercises />}
          {activeTab === 'diet' && <DoctorDiet />}
          {activeTab === 'reports' && <DoctorProgress />}
        </div>
      </main>
    </div>
  );
}
