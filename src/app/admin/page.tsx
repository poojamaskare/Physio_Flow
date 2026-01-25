'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import {
    fetchDashboardStats, fetchPatientGrowth, fetchTopDoctors,
    fetchDoctors, addDoctor, updateDoctorStatus, deleteDoctor,
    fetchPatients, addPatient, assignDoctor, deletePatient,
    fetchReportsData, Doctor, Patient, DashboardStats, WeeklyData
} from '@/lib/adminApi'

type Tab = 'dashboard' | 'doctors' | 'patients' | 'reports'

export default function AdminDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')

    // Dashboard state
    const [stats, setStats] = useState<DashboardStats>({ totalDoctors: 0, totalPatients: 0, totalSessions: 0, activeUsers: 0 })
    const [patientGrowth, setPatientGrowth] = useState<WeeklyData[]>([])
    const [topDoctors, setTopDoctors] = useState<{ name: string; patients: number }[]>([])

    // Doctors state
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [showAddDoctor, setShowAddDoctor] = useState(false)
    const [doctorForm, setDoctorForm] = useState({ name: '', email: '', phone: '', specialization: '', password: '' })

    // Patients state
    const [patients, setPatients] = useState<Patient[]>([])
    const [showAddPatient, setShowAddPatient] = useState(false)
    const [patientForm, setPatientForm] = useState({ name: '', email: '', phone: '', password: '', doctor_id: '' })

    // Reports state
    const [reportsData, setReportsData] = useState<any>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    useEffect(() => {
        if (user) loadTabData()
    }, [activeTab, user])

    const checkAuth = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'admin') {
            router.push('/login')
            return
        }
        setUser(currentUser)
        setLoading(false)
    }

    const loadTabData = async () => {
        if (activeTab === 'dashboard') {
            const [statsData, growthData, topData] = await Promise.all([
                fetchDashboardStats(),
                fetchPatientGrowth(),
                fetchTopDoctors()
            ])
            setStats(statsData)
            setPatientGrowth(growthData)
            setTopDoctors(topData)
        } else if (activeTab === 'doctors') {
            setDoctors(await fetchDoctors())
        } else if (activeTab === 'patients') {
            setPatients(await fetchPatients())
            setDoctors(await fetchDoctors())
        } else if (activeTab === 'reports') {
            setReportsData(await fetchReportsData())
        }
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    const handleAddDoctor = async () => {
        if (!doctorForm.name || !doctorForm.email || !doctorForm.password) return
        const result = await addDoctor(doctorForm)
        if (result.success) {
            setShowAddDoctor(false)
            setDoctorForm({ name: '', email: '', phone: '', specialization: '', password: '' })
            setDoctors(await fetchDoctors())
        }
    }

    const handleDeleteDoctor = async (id: string) => {
        if (confirm('Are you sure you want to delete this doctor?')) {
            await deleteDoctor(id)
            setDoctors(await fetchDoctors())
        }
    }

    const handleAddPatient = async () => {
        if (!patientForm.name || !patientForm.email || !patientForm.password) return
        const result = await addPatient(patientForm)
        if (result.success) {
            setShowAddPatient(false)
            setPatientForm({ name: '', email: '', phone: '', password: '', doctor_id: '' })
            setPatients(await fetchPatients())
        }
    }

    const handleDeletePatient = async (id: string) => {
        if (confirm('Are you sure you want to delete this patient?')) {
            await deletePatient(id)
            setPatients(await fetchPatients())
        }
    }

    const handleAssignDoctor = async (patientId: string, doctorId: string) => {
        await assignDoctor(patientId, doctorId)
        setPatients(await fetchPatients())
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
            </div>
        )
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
        { id: 'doctors', label: 'Doctors', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
        { id: 'patients', label: 'Patients', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
        { id: 'reports', label: 'Reports', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"></path></svg> },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            PhysioFlow
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {tab.icon}
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{user?.name}</p>
                            <p className="text-xs text-amber-400">Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard icon="👨‍⚕️" label="Total Doctors" value={stats.totalDoctors} color="cyan" />
                            <StatCard icon="🧑‍🤝‍🧑" label="Total Patients" value={stats.totalPatients} color="teal" />
                            <StatCard icon="🏋️" label="Exercise Sessions" value={stats.totalSessions} color="purple" />
                            <StatCard icon="🟢" label="Active Today" value={stats.activeUsers} color="green" />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Patient Growth Chart */}
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-6">Patient Growth (Last 7 Days)</h3>
                                <div className="h-48 flex items-end justify-between gap-2">
                                    {patientGrowth.map((day, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                            <div
                                                className="w-full bg-gradient-to-t from-cyan-500 to-teal-400 rounded-t-lg transition-all"
                                                style={{ height: `${Math.max(day.count * 30, 8)}px` }}
                                            ></div>
                                            <span className="text-xs text-slate-400">{day.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Doctors Chart */}
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-6">Top Doctors (By Patients)</h3>
                                <div className="space-y-4">
                                    {topDoctors.length > 0 ? topDoctors.map((doc, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <span className="w-8 text-center font-bold text-cyan-400">#{i + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium">{doc.name}</span>
                                                    <span className="text-teal-400">{doc.patients} patients</span>
                                                </div>
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                                                        style={{ width: `${Math.min(doc.patients * 10, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-slate-400 text-center py-8">No doctors yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Doctors Tab */}
                {activeTab === 'doctors' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold">Doctor Management</h1>
                            <button
                                onClick={() => setShowAddDoctor(true)}
                                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-xl text-slate-900 font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Doctor
                            </button>
                        </div>

                        {/* Doctors Table */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-6 py-4 font-semibold">Name</th>
                                        <th className="text-left px-6 py-4 font-semibold">Specialization</th>
                                        <th className="text-left px-6 py-4 font-semibold">Status</th>
                                        <th className="text-left px-6 py-4 font-semibold">Patients</th>
                                        <th className="text-left px-6 py-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctors.length > 0 ? doctors.map(doc => (
                                        <tr key={doc.id} className="border-t border-white/5 hover:bg-white/5">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium">{doc.name}</p>
                                                    <p className="text-sm text-slate-400">{doc.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{doc.specialization || 'Physiotherapy'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {doc.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
                                                    {doc.patientCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteDoctor(doc.id)}
                                                    className="px-3 py-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                No doctors found. Add your first doctor!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Doctor Modal */}
                        {showAddDoctor && (
                            <Modal onClose={() => setShowAddDoctor(false)} title="Add New Doctor">
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={doctorForm.name}
                                        onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={doctorForm.email}
                                        onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone (optional)"
                                        value={doctorForm.phone}
                                        onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Specialization"
                                        value={doctorForm.specialization}
                                        onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={doctorForm.password}
                                        onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <button
                                        onClick={handleAddDoctor}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-xl text-slate-900 font-semibold hover:shadow-lg transition-all"
                                    >
                                        Add Doctor
                                    </button>
                                </div>
                            </Modal>
                        )}
                    </div>
                )}

                {/* Patients Tab */}
                {activeTab === 'patients' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold">Patient Management</h1>
                            <button
                                onClick={() => setShowAddPatient(true)}
                                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-xl text-slate-900 font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Patient
                            </button>
                        </div>

                        {/* Patient Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {patients.length > 0 ? patients.map(patient => (
                                <div key={patient.id} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-xl">
                                            👤
                                        </div>
                                        <button
                                            onClick={() => handleDeletePatient(patient.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-semibold mb-1">{patient.name}</h3>
                                    <p className="text-slate-400 text-sm mb-4">{patient.email}</p>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <span>📞</span>
                                            <span>{patient.phone || 'No phone'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>👨‍⚕️</span>
                                            <select
                                                value={patient.doctor_id || ''}
                                                onChange={e => handleAssignDoctor(patient.id, e.target.value)}
                                                className="flex-1 px-3 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                                            >
                                                <option value="">Unassigned</option>
                                                {doctors.map(doc => (
                                                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-xs text-slate-500">
                                            Joined: {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-12 text-slate-400">
                                    No patients found. Add your first patient!
                                </div>
                            )}
                        </div>

                        {/* Add Patient Modal */}
                        {showAddPatient && (
                            <Modal onClose={() => setShowAddPatient(false)} title="Add New Patient">
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={patientForm.name}
                                        onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={patientForm.email}
                                        onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone (optional)"
                                        value={patientForm.phone}
                                        onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={patientForm.password}
                                        onChange={e => setPatientForm({ ...patientForm, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    />
                                    <select
                                        value={patientForm.doctor_id}
                                        onChange={e => setPatientForm({ ...patientForm, doctor_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="">Assign Doctor (optional)</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAddPatient}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-xl text-slate-900 font-semibold hover:shadow-lg transition-all"
                                    >
                                        Add Patient
                                    </button>
                                </div>
                            </Modal>
                        )}
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-8">Reports & Analytics</h1>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Weekly Stats */}
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span>📊</span> Weekly Summary
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">New Patients</span>
                                        <span className="text-2xl font-bold text-teal-400">{reportsData?.weeklyStats?.newPatients || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Sessions</span>
                                        <span className="text-2xl font-bold text-cyan-400">{reportsData?.weeklyStats?.sessions || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Avg Duration</span>
                                        <span className="text-2xl font-bold text-purple-400">{reportsData?.weeklyStats?.avgSessionTime || '0 min'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span>🎯</span> Total Patients
                                </h3>
                                <p className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                    {reportsData?.totalPatients || 0}
                                </p>
                                <p className="text-slate-400 mt-2">registered on platform</p>
                            </div>

                            {/* Growth Indicator */}
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span>📈</span> Growth
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5EF38C" strokeWidth="2">
                                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                            <polyline points="17 6 23 6 23 12"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-green-400">+12%</p>
                                        <p className="text-slate-400 text-sm">vs last week</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Doctor Performance */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <span>👨‍⚕️</span> Doctor Performance
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-slate-400 border-b border-white/10">
                                            <th className="pb-4">Doctor</th>
                                            <th className="pb-4">Patients</th>
                                            <th className="pb-4">Sessions</th>
                                            <th className="pb-4">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportsData?.doctorPerformance?.map((doc: any, i: number) => (
                                            <tr key={i} className="border-b border-white/5">
                                                <td className="py-4 font-medium">{doc.name}</td>
                                                <td className="py-4 text-cyan-400">{doc.patients}</td>
                                                <td className="py-4 text-teal-400">{doc.sessions}</td>
                                                <td className="py-4">
                                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                                                        ⭐ {doc.rating}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) || (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-slate-400">No data available</td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

// Components
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
        teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/20',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
        green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    }
    const textColors: Record<string, string> = {
        cyan: 'text-cyan-400',
        teal: 'text-teal-400',
        purple: 'text-purple-400',
        green: 'text-green-400',
    }

    return (
        <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-xl border rounded-2xl p-6`}>
            <div className="text-3xl mb-3">{icon}</div>
            <p className="text-slate-400 text-sm mb-1">{label}</p>
            <p className={`text-3xl font-bold ${textColors[color]}`}>{value}</p>
        </div>
    )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
