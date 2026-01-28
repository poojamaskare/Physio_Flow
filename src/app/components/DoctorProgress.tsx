'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Download, 
  Activity, 
  Users, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PatientReport {
  id: string;
  name: string;
  email: string;
  avgAccuracy: number;
  totalSessions: number;
  lastSessionDate: string | null;
  exercisesCompleted: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'inactive';
}

interface SessionHistory {
  id: string;
  patientName: string;
  exerciseName: string;
  accuracy: number;
  duration: number;
  date: string;
}

interface DoctorProgressProps {
  doctorId?: string;
}

export default function DoctorProgress({ doctorId }: DoctorProgressProps) {
  const [patients, setPatients] = useState<PatientReport[]>([]);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days');

  useEffect(() => {
    loadReportsData();
  }, [doctorId]);

  const loadReportsData = async () => {
    setLoading(true);
    
    // Fetch only patients assigned to this doctor
    let query = supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'patient');
    
    // Filter by doctor_id if provided
    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }
    
    const { data: patientsData } = await query;

    if (patientsData) {
      const patientsWithStats = await Promise.all(
        patientsData.map(async (patient) => {
          // Get sessions for this patient
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('accuracy, started_at, duration')
            .eq('patient_id', patient.id)
            .order('started_at', { ascending: false });

          const sessions = sessionData || [];
          const avgAccuracy = sessions.length > 0 
            ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length)
            : 0;
          
          const lastSession = sessions[0]?.started_at || null;
          
          // Determine status
          let status: PatientReport['status'] = 'inactive';
          if (sessions.length > 0) {
            const daysSinceLastSession = lastSession 
              ? Math.floor((Date.now() - new Date(lastSession).getTime()) / (1000 * 60 * 60 * 24))
              : 999;
            
            if (daysSinceLastSession > 7) {
              status = 'needs_attention';
            } else if (avgAccuracy >= 80) {
              status = 'excellent';
            } else if (avgAccuracy >= 60) {
              status = 'good';
            } else {
              status = 'needs_attention';
            }
          }

          return {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            avgAccuracy,
            totalSessions: sessions.length,
            lastSessionDate: lastSession,
            exercisesCompleted: sessions.length,
            status
          };
        })
      );

      setPatients(patientsWithStats);
    }

    // Fetch recent sessions
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select(`
        id,
        accuracy,
        duration,
        started_at,
        patient_id,
        exercise_id
      `)
      .order('started_at', { ascending: false })
      .limit(20);

    if (recentSessions) {
      const sessionsWithDetails = await Promise.all(
        recentSessions.map(async (session) => {
          const { data: patient } = await supabase
            .from('users')
            .select('name')
            .eq('id', session.patient_id)
            .single();

          const { data: exercise } = await supabase
            .from('exercises')
            .select('name')
            .eq('id', session.exercise_id)
            .single();

          return {
            id: session.id,
            patientName: patient?.name || 'Unknown',
            exerciseName: exercise?.name || 'Exercise',
            accuracy: session.accuracy || 0,
            duration: session.duration || 0,
            date: session.started_at
          };
        })
      );

      setSessions(sessionsWithDetails);
    }

    setLoading(false);
  };

  // Calculate summary stats
  const totalPatients = patients.length;
  const avgOverallAccuracy = patients.length > 0
    ? Math.round(patients.reduce((sum, p) => sum + p.avgAccuracy, 0) / patients.length)
    : 0;
  const totalSessions = patients.reduce((sum, p) => sum + p.totalSessions, 0);
  const patientsNeedingAttention = patients.filter(p => p.status === 'needs_attention' || p.status === 'inactive').length;

  const getStatusBadge = (status: PatientReport['status']) => {
    switch (status) {
      case 'excellent':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">Excellent</span>;
      case 'good':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400">Good</span>;
      case 'needs_attention':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400">Needs Attention</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-400">Inactive</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-xl transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{totalPatients}</div>
          <div className="text-sm text-slate-400">Total Patients</div>
        </div>
        
        <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Target className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{avgOverallAccuracy}%</div>
          <div className="text-sm text-slate-400">Avg Accuracy</div>
        </div>
        
        <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{totalSessions}</div>
          <div className="text-sm text-slate-400">Total Sessions</div>
        </div>
        
        <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{patientsNeedingAttention}</div>
          <div className="text-sm text-slate-400">Need Attention</div>
        </div>
      </div>

      {/* Patient Performance Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Patient Performance
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Patient</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Avg Accuracy</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Sessions</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Last Active</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? patients.map((patient) => (
                <tr key={patient.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-white">{patient.name}</p>
                      <p className="text-xs text-slate-400">{patient.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            patient.avgAccuracy >= 80 ? 'bg-green-500' :
                            patient.avgAccuracy >= 60 ? 'bg-cyan-500' :
                            patient.avgAccuracy >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${patient.avgAccuracy}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">{patient.avgAccuracy}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{patient.totalSessions}</td>
                  <td className="px-5 py-4 text-slate-300">{formatDate(patient.lastSessionDate)}</td>
                  <td className="px-5 py-4">{getStatusBadge(patient.status)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    No patient data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Sessions
          </h3>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        <div className="p-5 space-y-3">
          {sessions.length > 0 ? sessions.slice(0, 10).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{session.patientName}</p>
                  <p className="text-sm text-slate-400">{session.exerciseName}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className={`font-bold ${
                    session.accuracy >= 80 ? 'text-green-400' :
                    session.accuracy >= 60 ? 'text-cyan-400' : 'text-yellow-400'
                  }`}>{session.accuracy}%</p>
                  <p className="text-slate-500">Accuracy</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-300">{Math.round(session.duration / 60)} min</p>
                  <p className="text-slate-500">Duration</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">{formatDate(session.date)}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No sessions recorded yet</p>
              <p className="text-sm">Sessions will appear here when patients complete exercises</p>
            </div>
          )}
        </div>
      </div>

      {/* Accuracy Trend Chart */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Weekly Accuracy Trend
          </h3>
        </div>
        
        <div className="h-48 flex items-end gap-3 px-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const height = [65, 72, 68, 75, 82, 78, 85][i];
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group">
                  <div 
                    className="w-full bg-gradient-to-t from-cyan-500/80 to-teal-400/80 rounded-t-lg transition-all hover:from-cyan-500 hover:to-teal-400"
                    style={{ height: `${height * 1.8}px` }}
                  ></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 whitespace-nowrap z-10">
                    {height}% accuracy
                  </div>
                </div>
                <span className="text-xs text-slate-500">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
