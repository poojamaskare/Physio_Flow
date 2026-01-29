import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Activity } from 'lucide-react';
import { fetchAssignedPatients } from '@/lib/doctorApi';
import { Patient } from '@/lib/adminApi';

interface DoctorPatientsProps {
  doctorId?: string;
}

export default function DoctorPatients({ doctorId }: DoctorPatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      if (doctorId) {
        setLoading(true);
        const data = await fetchAssignedPatients(doctorId);
        setPatients(data);
        setLoading(false);
      }
    }
    loadPatients();
  }, [doctorId]);

  if (loading) {
    return <div className="text-slate-400 p-4">Loading patients...</div>;
  }

  if (patients.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-800 rounded-xl border border-slate-700">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Patients Assigned</h3>
        <p className="text-slate-400">You haven't been assigned any patients yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Patients</h2>
        <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold rounded-lg transition-colors">
          + Add Patient
        </button>
      </div>

      <div className="grid gap-4">
        {patients.map((patient, i) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-400/20 flex items-center justify-center group-hover:from-cyan-400/30 group-hover:to-teal-400/30 transition-all">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{patient.name}</h3>
                  <p className="text-sm text-slate-400">
                    {patient.email} • Joined: {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  'bg-green-500/10 text-green-400'
                }`}>
                  Active
                </span>
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <Activity className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
