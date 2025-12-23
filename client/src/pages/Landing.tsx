import { motion, useScroll, useTransform } from "framer-motion";
import { Activity, Stethoscope, ShieldAlert, Building2, ArrowRight, ChevronDown, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router";

export default function Landing() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const roles = [
    {
      id: "nurse",
      title: "Nurse View",
      subtitle: "Real-time patient triage and vital monitoring for emergency response teams",
      icon: Activity,
      path: "/auth/nurse",
    },
    {
      id: "doctor",
      title: "Doctor View",
      subtitle: "Intelligent patient queue management with specialty-based filtering",
      icon: Stethoscope,
      path: "/auth/doctor",
    },
    {
      id: "admin",
      title: "Admin Panel",
      subtitle: "Comprehensive analytics and resource allocation oversight",
      icon: ShieldAlert,
      path: "/auth/admin",
    },
    {
      id: "government",
      title: "Government View",
      subtitle: "City-wide hospital network monitoring and emergency coordination",
      icon: Building2,
      path: "/auth/government",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Wavy Lines Background - Bold Silver with Random Orientations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1920 1080"
        >
          {/* Multiple wavy flowing lines with varied orientations */}
          {[...Array(25)].map((_, i) => {
            const startY = -300 + i * 70;
            const delay = i * 0.08;
            const duration = 12 + (i % 6) * 2;
            const randomOffset = (i % 3) * 100 - 100;
            const curveIntensity = 150 + (i % 4) * 50;
            
            return (
              <motion.path
                key={`line-${i}`}
                d={`M -600 ${startY} Q ${400 + randomOffset} ${startY + curveIntensity}, ${960 + randomOffset} ${startY + curveIntensity / 2} T 2500 ${startY + curveIntensity * 0.8}`}
                stroke="rgba(192, 192, 192, 0.4)"
                strokeWidth={i % 2 === 0 ? "2.5" : "2"}
                fill="none"
                initial={{ pathLength: 0, opacity: 0, x: -600 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0, 0.5, 0.5, 0.3],
                  x: [0, 600]
                }}
                transition={{
                  pathLength: { duration: 3, delay },
                  opacity: { duration: 4, delay, times: [0, 0.3, 0.7, 1] },
                  x: { duration, delay, repeat: Infinity, ease: "linear" }
                }}
              />
            );
          })}
          
          {/* Additional accent lines with different curves and angles */}
          {[...Array(20)].map((_, i) => {
            const startY = 50 + i * 80;
            const delay = i * 0.12;
            const duration = 16 + (i % 5) * 3;
            const randomAngle = (i % 5) * 80 - 160;
            const waveHeight = 120 + (i % 3) * 60;
            
            return (
              <motion.path
                key={`accent-${i}`}
                d={`M -400 ${startY} Q ${700 + randomAngle} ${startY - waveHeight}, ${1300 + randomAngle} ${startY + waveHeight / 2} T 2600 ${startY + randomAngle / 2}`}
                stroke="rgba(192, 192, 192, 0.3)"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0, x: -500 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0, 0.4, 0.4, 0.2],
                  x: [0, 700]
                }}
                transition={{
                  pathLength: { duration: 3.5, delay },
                  opacity: { duration: 5, delay, times: [0, 0.3, 0.7, 1] },
                  x: { duration, delay, repeat: Infinity, ease: "linear" }
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Hero Section - Full Screen Centered */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center"
          >
            <Zap className="w-10 h-10 text-foreground" strokeWidth={1.5} />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[-0.02em] mb-6 text-foreground"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            T.R.I.A.G.E
          </motion.h1>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="inline-block px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <p className="text-sm md:text-base font-light tracking-[0.02em] text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Transparent. Accessible. Unbiased.
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <p className="text-xs text-muted-foreground font-light tracking-wider">Scroll to explore</p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Feature Cards Section */}
      <div className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-light tracking-[-0.02em] mb-3 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Role-Based Access
            </h2>
            <p className="text-sm text-muted-foreground font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              Specialized interfaces for every healthcare professional
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.8 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => navigate(role.path)}
                className="group cursor-pointer p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                {/* Icon Container */}
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <role.icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-base font-medium tracking-[-0.01em] mb-2 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {role.title}
                </h3>

                {/* Description */}
                <p className="text-sm font-light leading-relaxed text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {role.subtitle}
                </p>

                {/* Arrow */}
                <div className="mt-4 flex items-center text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Access Portal</span>
                  <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 pb-8 text-center text-xs text-muted-foreground font-light tracking-[0.02em]"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        SECURE CONNECTION ESTABLISHED • V.2.4.0
      </motion.div>
    </div>
  );
}