import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, Heart, Stethoscope, QrCode, ShieldAlert, HandHeart,
  ArrowRight, PawPrint, Megaphone, Eye, Sparkles,
  MapPin, Bell, Zap } from
"lucide-react";
import { motion, useMotionValue } from "framer-motion";

const modules = [
{
  path: "/perdidas",
  icon: Search,
  title: "Mascotas Perdidas",
  description: "Reportá y buscá mascotas perdidas con fotos, mapa y alertas por zona.",
  gradient: "from-red-500 to-rose-600",
  lightGradient: "from-red-500/15 to-rose-500/5",
  iconBg: "bg-red-500/15",
  iconColor: "text-red-500",
  borderColor: "border-red-400/40",
  shadowColor: "hover:shadow-red-500/20",
  tag: "Urgente",
  tagColor: "bg-red-500/10 text-red-500 border-red-500/20"
},
{
  path: "/adopcion",
  icon: Heart,
  title: "Adopción",
  description: "Encontrá tu compañero ideal. Perfiles, filtros y solicitudes en línea.",
  gradient: "from-emerald-500 to-teal-600",
  lightGradient: "from-emerald-500/15 to-teal-500/5",
  iconBg: "bg-emerald-500/15",
  iconColor: "text-emerald-500",
  borderColor: "border-emerald-400/40",
  shadowColor: "hover:shadow-emerald-500/20",
  tag: "Popular",
  tagColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
},
{
  path: "/veterinarias",
  icon: Stethoscope,
  title: "Veterinarias de Turno",
  description: "Consultá qué veterinaria está de turno ahora, con mapa y llamada directa.",
  gradient: "from-blue-500 to-sky-600",
  lightGradient: "from-blue-500/15 to-sky-500/5",
  iconBg: "bg-blue-500/15",
  iconColor: "text-blue-500",
  borderColor: "border-blue-400/40",
  shadowColor: "hover:shadow-blue-500/20",
  tag: "24h",
  tagColor: "bg-blue-500/10 text-blue-600 border-blue-500/20"
},
{
  path: "/identificacion",
  icon: QrCode,
  title: "ID Digital (QR / NFC)",
  description: "Creá la ficha digital de tu mascota. Generá un QR para el collar.",
  gradient: "from-purple-500 to-violet-600",
  lightGradient: "from-purple-500/15 to-violet-500/5",
  iconBg: "bg-purple-500/15",
  iconColor: "text-purple-500",
  borderColor: "border-purple-400/40",
  shadowColor: "hover:shadow-purple-500/20",
  tag: "Nuevo",
  tagColor: "bg-purple-500/10 text-purple-600 border-purple-500/20"
},
{
  path: "/denuncias",
  icon: ShieldAlert,
  title: "Denuncias de Maltrato",
  description: "Denunciá situaciones de maltrato animal con evidencia y geolocalización.",
  gradient: "from-amber-500 to-orange-600",
  lightGradient: "from-amber-500/15 to-orange-500/5",
  iconBg: "bg-amber-500/15",
  iconColor: "text-amber-500",
  borderColor: "border-amber-400/40",
  shadowColor: "hover:shadow-amber-500/20",
  tag: "Anónimo",
  tagColor: "bg-amber-500/10 text-amber-600 border-amber-500/20"
},
{
  path: "/casos-urgentes",
  icon: HandHeart,
  title: "Casos Urgentes",
  description: "Ayudá a animales en emergencia. Donaciones, traslados y más.",
  gradient: "from-pink-500 to-rose-600",
  lightGradient: "from-pink-500/15 to-rose-500/5",
  iconBg: "bg-pink-500/15",
  iconColor: "text-pink-500",
  borderColor: "border-pink-400/40",
  shadowColor: "hover:shadow-pink-500/20",
  tag: "Solidario",
  tagColor: "bg-pink-500/10 text-pink-600 border-pink-500/20"
}];


const floatingPaws = [
{ x: "8%", y: "18%", size: 26, delay: 0, opacity: 0.08, rotate: -15 },
{ x: "78%", y: "8%", size: 34, delay: 0.6, opacity: 0.06, rotate: 20 },
{ x: "62%", y: "65%", size: 22, delay: 1.1, opacity: 0.08, rotate: -5 },
{ x: "22%", y: "72%", size: 30, delay: 0.9, opacity: 0.06, rotate: 30 },
{ x: "88%", y: "45%", size: 18, delay: 0.4, opacity: 0.09, rotate: -25 },
{ x: "45%", y: "85%", size: 20, delay: 1.5, opacity: 0.05, rotate: 10 }];


// Magnetic button hook
function useMagnetic(strength = 0.3) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, x, y, handleMouseMove, handleMouseLeave };
}

// Shimmer card component with mouse tracking glow
function ModuleCard({ mod, index }) {
  const cardRef = useRef(null);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setGlowPos({
      x: (e.clientX - rect.left) / rect.width * 100,
      y: (e.clientY - rect.top) / rect.height * 100
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.08 + index * 0.08, ease: [0.25, 0.46, 0.45, 0.94], duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.01 }}>
      
      <Link to={mod.path} className="block h-full">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative overflow-hidden rounded-2xl border-2 ${mod.borderColor} bg-card p-6 h-full cursor-pointer transition-all duration-300 ${mod.shadowColor} hover:shadow-2xl group`}
          style={{
            background: isHovered ?
            `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, hsl(var(--card)) 0%, hsl(var(--card)) 60%)` :
            undefined
          }}>
          
          {/* Glow overlay */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${mod.lightGradient} transition-opacity duration-300`}
            animate={{ opacity: isHovered ? 1 : 0 }} />
          

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
              transition: "opacity 0.3s"
            }} />
          

          <div className="relative z-10 flex flex-col h-full gap-4">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-12 h-12 rounded-2xl ${mod.iconBg} flex items-center justify-center`}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}>
                  
                  <mod.icon className={`w-6 h-6 ${mod.iconColor}`} />
                </motion.div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${mod.tagColor}`}>
                  {mod.tag}
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={isHovered ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.5, rotate: -45 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-md`}>
                
                <ArrowRight className="w-4 h-4 text-white" />
              </motion.div>
            </div>

            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg mb-1.5 tracking-tight text-[hsl(var(--card-foreground))]">
                {mod.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {mod.description}
              </p>
            </div>

            {/* Bottom CTA */}
            <motion.div
              className={`flex items-center gap-1.5 text-sm font-semibold ${mod.iconColor}`}
              animate={isHovered ? { x: 4 } : { x: 0 }}
              transition={{ type: "spring", stiffness: 400 }}>
              
              Ir al módulo
              <motion.div animate={isHovered ? { x: 3 } : { x: 0 }} transition={{ type: "spring", stiffness: 400 }}>
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>);

}

// Pill button with gradient border
function GradientButton({ children, onClick, gradient, shadowColor, className = "" }) {
  const [isPressed, setIsPressed] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96, y: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`relative overflow-hidden rounded-2xl font-bold text-white px-7 py-3.5 text-sm flex items-center gap-2.5 shadow-xl ${shadowColor} ${className}`}
      style={{ background: gradient }}>
      
      {/* Shine sweep */}
      <motion.div
        className="absolute inset-0 opacity-0"
        style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)" }}
        animate={isPressed ? {} : { x: ["-100%", "200%"], opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }} />
      
      {children}
    </motion.button>);

}

function OutlineButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96, y: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="relative overflow-hidden rounded-2xl font-bold text-white px-7 py-3.5 text-sm flex items-center gap-2.5 border-2 border-white/25 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors duration-200">
      
      {children}
    </motion.button>);

}

// Stats bar
const stats = [
{ icon: PawPrint, label: "Mascotas reunidas", value: "124+", color: "text-primary" },
{ icon: Heart, label: "Adopciones exitosas", value: "42", color: "text-pink-500" },
{ icon: MapPin, label: "Veterinarias activas", value: "18", color: "text-blue-500" },
{ icon: Zap, label: "Casos resueltos", value: "67", color: "text-amber-500" }];


export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/perdidas?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="space-y-10">
      {/* ─── HERO ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-sidebar border border-sidebar-border shadow-2xl min-h-[360px]">
        
        {/* Animated paws */}
        {floatingPaws.map((p, i) =>
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: p.x, top: p.y, opacity: p.opacity, rotate: p.rotate }}
          animate={{ y: [0, -14, 0], rotate: [p.rotate, p.rotate + 8, p.rotate] }}
          transition={{ duration: 4 + i * 0.8, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}>
          
            <PawPrint style={{ width: p.size, height: p.size }} className="text-white" />
          </motion.div>
        )}

        {/* Blobs */}
        <motion.div
          className="absolute -top-24 -right-24 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        
        <motion.div
          className="absolute -bottom-16 -left-12 w-72 h-72 bg-accent/15 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        
        <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-8 md:p-12 max-w-3xl space-y-7">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="inline-flex items-center gap-2 bg-primary/20 border border-primary/35 rounded-full px-4 py-1.5">
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
              
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </motion.div>
            <span className="text-primary font-heading font-bold text-xs uppercase tracking-widest">
              Conectando Huellas · Orán
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3">
            
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Bienvenidos a{" "}
              <span className="text-primary relative">
                Koko
                <motion.span
                  className="absolute -bottom-1 left-0 h-1 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }} />
                
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sidebar-foreground/70 text-base md:text-lg max-w-xl leading-relaxed">
              
              La red solidaria para proteger, identificar y rescatar a los animales que más lo necesitan.
            </motion.p>
          </motion.div>

          {/* Search */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-2 max-w-md">
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar por raza, zona o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-white/10 border border-white/20 text-white pl-9 pr-3 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm backdrop-blur-sm transition-all" />
              
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-10 px-5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-primary/40">
              
              Buscar
            </motion.button>
          </motion.form>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-3">
            
            <GradientButton
              onClick={() => navigate("/perdidas?action=report")}
              gradient="linear-gradient(135deg, #ef4444, #dc2626)"
              shadowColor="shadow-red-500/40">
              
              <Megaphone className="w-5 h-5" />
              Perdí mi mascota
            </GradientButton>
            <OutlineButton onClick={() => navigate("/perdidas?action=sighting")}>
              <Eye className="w-5 h-5" />
              Encontré un animal
            </OutlineButton>
          </motion.div>
        </div>
      </motion.div>

      {/* ─── STATS BAR ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {stats.map((stat, i) =>
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55 + i * 0.07, type: "spring", stiffness: 200 }}
          whileHover={{ y: -3, scale: 1.02 }}
          className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          
            <div className={`${stat.color} mb-1`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <span className={`font-heading text-2xl font-extrabold ${stat.color}`}>{stat.value}</span>
            <span className="text-muted-foreground text-xs leading-tight">{stat.label}</span>
          </motion.div>
        )}
      </motion.div>

      {/* ─── MÓDULOS ────────────────────────────────────────── */}
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3">
          
          <h2 className="font-heading text-xl font-bold tracking-tight">Explorar Servicios</h2>
          <motion.span
            className="flex-1 h-px bg-gradient-to-r from-border to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{ transformOrigin: "left" }} />
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
            
            6 módulos
          </motion.span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, i) =>
          <ModuleCard key={mod.path} mod={mod} index={i} />
          )}
        </div>
      </div>

      {/* ─── CTA BOTTOM ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 to-emerald-600 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20">
        
        <motion.div
          className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity }} />
        
        <div className="text-white space-y-2 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-xs font-semibold uppercase tracking-widest">Alertas de zona</span>
          </div>
          <h3 className="font-heading text-2xl font-extrabold">Activá alertas cerca tuyo</h3>
          <p className="text-white/75 text-sm max-w-sm">Recibí notificaciones cuando aparezca una mascota perdida en tu barrio.</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="relative z-10">
          
          <Link
            to="/perdidas"
            className="inline-flex items-center gap-2.5 bg-white text-primary font-bold px-7 py-3.5 rounded-2xl text-sm shadow-lg hover:shadow-xl transition-shadow whitespace-nowrap">
            
            <Bell className="w-4 h-4" />
            Configurar alertas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>
    </div>);

}