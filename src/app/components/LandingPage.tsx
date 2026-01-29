'use client'

import { motion } from "framer-motion"
import { useTheme } from "./ThemeProvider"
import { 
    Activity, 
    Heart, 
    BarChart3, 
    Zap, 
    Users, 
    Target, 
    Sun, 
    Moon, 
    Star, 
    ArrowRight,
    UserPlus,
    Stethoscope
} from "lucide-react"

interface LandingPageProps {
    onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === "dark"

    // Colors matching the login page theme
    const colors = {
        light: {
            bg: "from-slate-100 via-slate-50 to-slate-100",
            card: "bg-white/90",
            cardBorder: "border-slate-200",
            text: "text-slate-900",
            textSecondary: "text-slate-600",
            inputBg: "bg-slate-100/50",
            inputBorder: "border-slate-300",
        },
        dark: {
            bg: "from-slate-900 via-slate-800 to-slate-900",
            card: "bg-slate-800/90",
            cardBorder: "border-white/10",
            text: "text-white",
            textSecondary: "text-slate-400",
            inputBg: "bg-slate-700/50",
            inputBorder: "border-slate-600",
        },
    }

    const c = isDark ? colors.dark : colors.light

    const features = [
        {
            icon: <Activity size={28} />,
            title: "AI Pose Detection",
            description: "Real-time skeletal tracking ensures correct exercise form with instant accuracy feedback.",
        },
        {
            icon: <Heart size={28} />,
            title: "Personalized Plans",
            description: "Custom treatment and nutrition plans tailored to your specific recovery goals.",
        },
        {
            icon: <BarChart3 size={28} />,
            title: "Progress Analytics",
            description: "Comprehensive dashboards with detailed insights into your recovery journey.",
        },
        {
            icon: <Zap size={28} />,
            title: "Instant Feedback",
            description: "Get real-time corrections during exercise sessions for optimal results.",
        },
        {
            icon: <Users size={28} />,
            title: "Doctor Connect",
            description: "Secure messaging and video calls with your healthcare providers.",
        },
        {
            icon: <Target size={28} />,
            title: "Goal Tracking",
            description: "Set recovery milestones and celebrate achievements as you progress.",
        },
    ]



    return (
        <div className={`min-h-screen bg-gradient-to-br ${c.bg} transition-colors duration-500`}>
            {/* Navigation */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 ${isDark ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-xl ${c.cardBorder} border-b`}
            >
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 shadow-lg">
                            <Activity size={24} className="text-white" />
                        </div>
                        <span className={`text-2xl font-bold ${c.text}`}>
                            Physio<span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Flow</span>
                        </span>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-xl ${c.card} ${c.cardBorder} border shadow-sm hover:shadow-md transition-shadow`}
                        >
                            {isDark ? (
                                <Sun size={20} className="text-cyan-400" />
                            ) : (
                                <Moon size={20} className="text-slate-500" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-radial from-cyan-500/20 to-transparent"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                        className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-radial from-teal-500/20 to-transparent"
                    />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-10 ${isDark ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-500/10 border border-cyan-500/20'}`}
                    >
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Star size={16} className="text-cyan-400" />
                        </motion.div>
                        <span className="text-sm font-semibold text-cyan-400">
                            AI-Powered Rehabilitation Platform
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className={`text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-[1.05] tracking-tight ${c.text}`}
                    >
                        Transform Your
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Recovery Journey
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={`text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed ${c.textSecondary}`}
                    >
                        Experience personalized physiotherapy with real-time AI pose detection,
                        custom treatment plans, and seamless doctor-patient collaboration.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onGetStarted}
                            className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-900 rounded-2xl text-lg font-semibold flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                        >
                            Get Started Free
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                →
                            </motion.span>
                        </motion.button>


                    </motion.div>

                    {/* Stats Section moved to Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-12 w-full"
                    >
                        <div className="flex flex-wrap justify-center items-center gap-6">
                            {[
                                { value: "98%", label: "Recovery Rate" },
                                { value: "1K+", label: "Happy Patients" },
                                { value: "50+", label: "Expert Doctors" },
                                { value: "24/7", label: "Support" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -2 }}
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl min-w-[140px] backdrop-blur-sm ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}
                                >
                                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-1">
                                        {stat.value}
                                    </div>
                                    <p className={`font-medium text-sm ${c.textSecondary}`}>{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-6 h-10 border-2 rounded-full flex justify-center pt-2 ${c.cardBorder}`}
                    >
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        />
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Section */}
            {/* Features Section */}
            <section className={`py-20 px-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <motion.span
                            className="inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wider mb-6 bg-cyan-500/10 text-cyan-400"
                        >
                            FEATURES
                        </motion.span>
                        <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${c.text}`}>
                            Cutting-Edge Healthcare
                            <br />
                            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Technology</span>
                        </h2>
                        <p className={`text-lg max-w-2xl mx-auto ${c.textSecondary}`}>
                            AI-powered tools combined with medical expertise for exceptional rehabilitation outcomes.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={`p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-400 ${c.card} backdrop-blur-xl ${c.cardBorder} border`}
                            >
                                <motion.div
                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-gradient-to-br from-cyan-500 to-teal-400 text-white"
                                >
                                    {feature.icon}
                                </motion.div>
                                <h3 className={`text-xl font-bold mb-3 ${c.text}`}>
                                    {feature.title}
                                </h3>
                                <p className={`leading-relaxed ${c.textSecondary}`}>
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>



            {/* How It Works */}
            <section className={`py-20 px-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wider mb-6 bg-teal-500/10 text-teal-400">
                            HOW IT WORKS
                        </span>
                        <h2 className={`text-4xl md:text-5xl font-bold ${c.text}`}>
                            Three Simple <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Steps</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-10 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-1 rounded-full opacity-30 bg-gradient-to-r from-cyan-500 to-teal-400" />

                        {[
                            { step: "01", title: "Create Account", description: "Sign up and complete your health profile.", icon: UserPlus },
                            { step: "02", title: "Connect with Doctor", description: "Get matched with a specialist for your plan.", icon: Stethoscope },
                            { step: "03", title: "Start Exercising", description: "Follow AI-guided sessions with real-time feedback.", icon: Activity },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="text-center relative z-10"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-cyan-500 to-teal-400 shadow-lg shadow-cyan-500/30"
                                >
                                    <item.icon size={40} className="text-white" />
                                </motion.div>
                                <div className={`text-6xl font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 opacity-20 ${isDark ? 'text-white/10' : 'text-black/10'}`}>
                                    {item.step}
                                </div>
                                <h3 className={`text-xl font-bold mb-2 relative z-10 ${c.text}`}>
                                    {item.title}
                                </h3>
                                <p className={`relative z-10 ${c.textSecondary}`}>
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>



            {/* CTA Section */}
            <section className={`py-20 px-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <motion.div
                        animate={{
                            boxShadow: [
                                "0 0 0 0 rgba(6, 182, 212, 0.4)",
                                "0 0 0 30px rgba(6, 182, 212, 0)",
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-10 bg-gradient-to-br from-cyan-500 to-teal-400"
                    >
                        <Star size={40} className="text-white" />
                    </motion.div>

                    <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${c.text}`}>
                        Ready to Start Your
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Recovery Journey?</span>
                    </h2>
                    <p className={`text-lg mb-10 max-w-xl mx-auto ${c.textSecondary}`}>
                        Join thousands of patients who have transformed their rehabilitation experience with PhysioFlow.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGetStarted}
                        className="px-12 py-5 text-slate-900 rounded-2xl text-xl font-bold inline-flex items-center gap-3 mb-8 bg-gradient-to-r from-cyan-500 to-teal-400 shadow-lg shadow-cyan-500/40"
                    >
                        Get Started Now
                        <span>→</span>
                    </motion.button>


                </motion.div>
            </section>

            {/* Footer */}
            <footer className={`py-12 px-4 ${isDark ? 'bg-slate-900' : 'bg-white'} ${c.cardBorder} border-t`}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-400">
                            <Activity size={20} className="text-white" />
                        </div>
                        <span className={`text-xl font-bold ${c.text}`}>
                            Physio<span className="text-cyan-400">Flow</span>
                        </span>
                    </div>
                    <p className={`text-sm ${c.textSecondary}`}>
                        © 2026 PhysioFlow. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {["Privacy", "Terms", "Contact"].map((link) => (
                            <a
                                key={link}
                                href="#"
                                className={`text-sm hover:underline transition-all ${c.textSecondary}`}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    )
}