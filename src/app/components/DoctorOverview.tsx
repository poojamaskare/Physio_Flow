import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Cloud, CircleArrowDown, UserPlus, PlayCircle } from 'lucide-react';
import { fetchDoctorActivity, ActivityItem } from '@/lib/doctorApi';

export default function DoctorOverview({ doctorId, onPatientSelect }: { doctorId?: string, onPatientSelect: (id: number) => void }) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    
    useEffect(() => {
        if (doctorId) {
            fetchDoctorActivity(doctorId).then(setActivities);
        }
    }, [doctorId]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Patients', value: '12', icon: Users, gradient: 'from-cyan-400 to-cyan-600' },
                    { label: 'Appointments Today', value: '4', icon: Cloud, gradient: 'from-purple-400 to-purple-600' },
                    { label: 'Pending Reviews', value: '3', icon: CircleArrowDown, gradient: 'from-orange-400 to-orange-600' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-slate-800 rounded-2xl border border-slate-700"
                    >
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 text-white shadow-lg`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-slate-400">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700">
                <h3 className="font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {activities.length > 0 ? activities.map((activity, i) => (
                        <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/30 border border-slate-700 hover:border-cyan-500/30 transition-colors">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                 activity.type === 'joined' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                             }`}>
                                 {activity.type === 'joined' ? <UserPlus className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                             </div>
                             <div className="flex-1">
                                 <p className="text-white font-medium">
                                     <span className="text-cyan-400">{activity.patientName}</span> {activity.description}
                                 </p>
                                 <p className="text-xs text-slate-400">{new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}</p>
                             </div>
                        </div>
                    )) : (
                        <p className="text-slate-400">No recent activity found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
