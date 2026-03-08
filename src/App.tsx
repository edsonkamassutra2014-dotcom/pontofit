/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity as ActivityIcon, 
  Dumbbell, 
  Timer, 
  Trophy, 
  User as UserIcon, 
  ChefHat, 
  ChevronRight, 
  Flame, 
  Plus, 
  History,
  LogOut,
  Save,
  ArrowLeft,
  Play,
  Square,
  Users,
  Medal,
  TrendingUp,
  Search,
  Building2,
  Swords,
  Target,
  ClipboardList,
  QrCode,
  ShoppingBag,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Activity, DashboardData, Recipe, Trainer, Gym, GymRankingEntry } from './types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const showToast = (message: string, isError = false) => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm z-50 shadow-2xl transition-all duration-300 ${isError ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black'}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

// --- Mock Recipes (Angolan Context) ---
const ANGOLAN_RECIPES: Recipe[] = [
  // --- EMAGRECER (SECAR) ---
  {
    id: '1',
    title: 'Mufete Fit (Peixe Grelhado)',
    category: 'emagrecer',
    ingredients: ['Peixe fresco (Cacucho ou Carapau)', 'Batata doce cozida', 'Feijão de óleo de palma (moderado)', 'Farofa de mandioca', 'Molho de cebola e tomate'],
    instructions: 'Grelhe o peixe com pouco sal. Sirva com batata doce e uma porção pequena de feijão. Use azeite em vez de óleo de palma em excesso.'
  },
  {
    id: '3',
    title: 'Calulu de Peixe Seco Light',
    category: 'emagrecer',
    ingredients: ['Peixe seco', 'Rama de batata ou espinafre', 'Gongo', 'Quiabos', 'Tomate e cebola'],
    instructions: 'Prepare o calulu tradicional mas reduza drasticamente o óleo de palma. Foque nos vegetais e na proteína do peixe.'
  },
  {
    id: '4',
    title: 'Salada de Feijão Frade com Atum',
    category: 'emagrecer',
    ingredients: ['Feijão frade cozido', 'Atum ao natural', 'Cebola picada', 'Salsa', 'Vinagre e um fio de azeite'],
    instructions: 'Misture todos os ingredientes. Uma opção fresca, rica em proteína e fibras para manter a saciedade.'
  },
  {
    id: '5',
    title: 'Frango Grelhado com Quiabos',
    category: 'emagrecer',
    ingredients: ['Peito de frango', 'Quiabos cozidos ou grelhados', 'Alho', 'Limão', 'Pimenta'],
    instructions: 'Tempere o frango com limão e alho. Grelhe sem óleo. Acompanhe com quiabos para ajudar na digestão e saciedade.'
  },
  {
    id: '6',
    title: 'Sopa de Abóbora e Gengibre',
    category: 'emagrecer',
    ingredients: ['Abóbora', 'Cenoura', 'Gengibre fresco', 'Cebola', 'Peito de frango desfiado'],
    instructions: 'Cozinhe os vegetais e bata no liquidificador. Adicione o frango desfiado no final para proteína. O gengibre acelera o metabolismo.'
  },
  {
    id: '7',
    title: 'Omelete de Claras com Rama',
    category: 'emagrecer',
    ingredients: ['3 Claras de ovo', '1 Gema', 'Rama de batata doce ou espinafre', 'Cebola'],
    instructions: 'Refogue a rama com cebola e junte os ovos batidos. Use uma frigideira antiaderente para não precisar de óleo.'
  },
  {
    id: '8',
    title: 'Peixe ao Vapor com Legumes',
    category: 'emagrecer',
    ingredients: ['Filetes de peixe', 'Brócolos', 'Cenoura', 'Beringela', 'Limão'],
    instructions: 'Cozinhe tudo ao vapor para preservar os nutrientes. Tempere com ervas e limão no final.'
  },

  // --- GANHAR MASSA (CRESCER) ---
  {
    id: '2',
    title: 'Batido de Abacate e Banana',
    category: 'ganhar_massa',
    ingredients: ['1 Abacate médio', '2 Bananas maduras', 'Leite em pó ou líquido', 'Mel (opcional)'],
    instructions: 'Bata tudo no liquidificador. Rico em gorduras boas e carboidratos para energia pós-treino.'
  },
  {
    id: '9',
    title: 'Funge de Milho com Carne de Vaca',
    category: 'ganhar_massa',
    ingredients: ['Farinha de milho', 'Carne de vaca magra', 'Tomate', 'Cebola', 'Alho'],
    instructions: 'Prepare o funge tradicional. A carne deve ser grelhada ou estufada com pouco óleo. Excelente fonte de energia e proteína.'
  },
  {
    id: '10',
    title: 'Batido Hipercalórico de Amendoim',
    category: 'ganhar_massa',
    ingredients: ['Leite', '2 colheres de Pasta de Amendoim', 'Aveia em flocos', '1 Banana'],
    instructions: 'Bata tudo. Perfeito para quem tem dificuldade em ganhar peso. Muita energia e proteína vegetal.'
  },
  {
    id: '11',
    title: 'Massa Integral com Atum e Ovos',
    category: 'ganhar_massa',
    ingredients: ['Massa integral', '2 Latas de Atum', '2 Ovos cozidos', 'Molho de tomate caseiro'],
    instructions: 'Cozinhe a massa e misture com o atum e ovos. Carboidratos complexos e proteína de alta qualidade.'
  },
  {
    id: '12',
    title: 'Batido de Iogurte e Manga',
    category: 'ganhar_massa',
    ingredients: ['Iogurte natural', '1 Manga madura', 'Sementes de abóbora', 'Mel'],
    instructions: 'Bata a manga com o iogurte. Adicione as sementes por cima. Rico em vitaminas e calorias saudáveis.'
  },
  {
    id: '13',
    title: 'Bife de Vaca com Mandioca',
    category: 'ganhar_massa',
    ingredients: ['Bife de vaca', 'Mandioca cozida', 'Alho', 'Louro', 'Azeite'],
    instructions: 'Grelhe o bife com alho e louro. Acompanhe com mandioca cozida (carboidrato de absorção lenta).'
  },
  {
    id: '14',
    title: 'Arroz de Feijão com Ovos',
    category: 'ganhar_massa',
    ingredients: ['Arroz branco ou integral', 'Feijão preto ou encarnado', '3 Ovos', 'Cebola'],
    instructions: 'Faça um arroz de feijão bem consistente. Sirva com ovos escalfados ou fritos com o mínimo de gordura.'
  }
];

// --- Views ---

interface BottomNavProps {
  currentView: string;
  setView: (view: any) => void;
  user?: User | null;
}

const BottomNav = ({ currentView, setView, user }: BottomNavProps) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-2 z-20 overflow-x-auto no-scrollbar">
    <div className="flex items-center space-x-6 px-4 min-w-max pb-2 pt-2">
      <button onClick={() => setView('dashboard')} className={`flex flex-col items-center space-y-1 ${currentView === 'dashboard' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <ActivityIcon className="w-6 h-6" />
        <span className="text-[10px] font-bold">HOME</span>
      </button>
      <button onClick={() => setView('weekly')} className={`flex flex-col items-center space-y-1 ${currentView === 'weekly' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <Target className="w-6 h-6" />
        <span className="text-[10px] font-bold">SEMANA</span>
      </button>
      <button onClick={() => setView('recipes')} className={`flex flex-col items-center space-y-1 ${currentView === 'recipes' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <ChefHat className="w-6 h-6" />
        <span className="text-[10px] font-bold">RECEITAS</span>
      </button>
      <button onClick={() => setView('history')} className={`flex flex-col items-center space-y-1 ${currentView === 'history' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <History className="w-6 h-6" />
        <span className="text-[10px] font-bold">HISTÓRICO</span>
      </button>
      <button onClick={() => setView(user?.role === 'trainer' ? 'instructor' : 'trainer')} className={`flex flex-col items-center space-y-1 ${currentView === 'trainer' || currentView === 'instructor' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <ClipboardList className="w-6 h-6" />
        <span className="text-[10px] font-bold">{user?.role === 'trainer' ? 'MEUS ALUNOS' : 'TREINADOR'}</span>
      </button>
      <button onClick={() => setView('gyms')} className={`flex flex-col items-center space-y-1 ${currentView === 'gyms' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <Building2 className="w-6 h-6" />
        <span className="text-[10px] font-bold">GINÁSIOS</span>
      </button>
      <button onClick={() => setView('competitions')} className={`flex flex-col items-center space-y-1 ${currentView === 'competitions' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <Swords className="w-6 h-6" />
        <span className="text-[10px] font-bold">COMPETIÇÕES</span>
      </button>
      <button onClick={() => setView('shop')} className={`flex flex-col items-center space-y-1 ${currentView === 'shop' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <ShoppingBag className="w-6 h-6" />
        <span className="text-[10px] font-bold">LOJA</span>
      </button>
      <button onClick={() => setView('profile')} className={`flex flex-col items-center space-y-1 ${currentView === 'profile' ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <UserIcon className="w-6 h-6" />
        <span className="text-[10px] font-bold">PERFIL</span>
      </button>
    </div>
  </nav>
);

interface AuthViewProps {
  key?: string;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  authForm: any;
  setAuthForm: (form: any) => void;
  handleAuth: (e: React.FormEvent) => void;
  loading: boolean;
  authError: string;
}

const AuthView = ({ authMode, setAuthMode, authForm, setAuthForm, handleAuth, loading, authError }: AuthViewProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthForm({ ...authForm, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://i.postimg.cc/DzTFMbpV/2026-03-06-at-19-37-26.jpg" 
          alt="Gym Background" 
          className="w-full h-full object-cover"
          style={{ backgroundPosition: 'center' }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10 bg-black/30 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl"
      >
        <div className="text-center flex flex-col items-center">
          <img 
            src="https://i.postimg.cc/CLsWx6mc/Whats-App-Image-2026-03-07-at-21-17-16.jpg"
            alt="PontoC Fit Logo"
            className="w-16 h-16 mb-4 object-contain"
            style={{ 
              filter: 'invert(1) sepia(1) saturate(500%) hue-rotate(100deg) brightness(0.9)',
              mixBlendMode: 'screen'
            }}
            referrerPolicy="no-referrer"
          />
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-6xl font-black tracking-tighter text-emerald-500 italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
          >
            PONTOC FIT
          </motion.h1>
          <p className="text-white mt-2 font-bold drop-shadow-md">O teu ginásio no bolso.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-center font-medium">
              {authError}
            </div>
          )}
          {authMode === 'register' && (
            <>
              <div className="flex flex-col items-center mb-4">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center overflow-hidden hover:border-emerald-500 transition-colors"
                >
                  {authForm.photo ? (
                    <img src={authForm.photo} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <Plus className="w-6 h-6 text-zinc-500" />
                  )}
                </button>
                <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-widest">Foto de Perfil</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <input
                type="text"
                placeholder="Nome Completo"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500 transition-colors"
                value={authForm.name}
                onChange={e => setAuthForm({...authForm, name: e.target.value})}
                required
              />
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAuthForm({...authForm, role: 'student'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${authForm.role !== 'trainer' ? 'bg-emerald-500 text-black' : 'text-zinc-500'}`}
                >
                  ALUNO
                </button>
                <button
                  type="button"
                  onClick={() => setAuthForm({...authForm, role: 'trainer'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${authForm.role === 'trainer' ? 'bg-emerald-500 text-black' : 'text-zinc-500'}`}
                >
                  TREINADOR
                </button>
              </div>
            </>
          )}
          <input
            type="tel"
            placeholder="Telefone"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500 transition-colors"
            value={authForm.phone}
            onChange={e => setAuthForm({...authForm, phone: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Palavra-passe"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500 transition-colors"
            value={authForm.password}
            onChange={e => setAuthForm({...authForm, password: e.target.value})}
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processando...' : authMode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-zinc-500 hover:text-emerald-500 transition-colors"
          >
            {authMode === 'login' ? 'Não tem conta? Registe-se' : 'Já tem conta? Entre aqui'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface DashboardViewProps {
  key?: string;
  user: User | null;
  dashboardData: DashboardData | null;
  setView: (view: any) => void;
}

const DashboardView = ({ user, dashboardData, setView }: DashboardViewProps) => {
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/student/notes/${user.id}`)
        .then(res => res.json())
        .then(data => setNotes(data))
        .catch(console.error);
    }
  }, [user]);

  return (
  <div className="min-h-screen text-white pb-24">
    {/* Header with Hero Image */}
    <div className="relative h-72 overflow-hidden">
      <img 
        src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
        alt="Workout Hero" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-emerald-400 text-sm font-black uppercase tracking-[0.2em] mb-1 drop-shadow-lg">PONTOC FIT LUANDA</h2>
          <p className="text-4xl font-black italic tracking-tighter leading-none">VAMOS NESSA,<br/>{user?.name?.split(' ')[0]}?</p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setView('profile')} 
          className="p-1 bg-emerald-500 rounded-full border-4 border-black shadow-2xl"
        >
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
            {user?.photo ? (
              <img src={user.photo} className="w-full h-full object-cover" alt="Me" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-8 h-8 text-emerald-500" />
            )}
          </div>
        </motion.button>
      </div>
    </div>

    <div className="p-6 space-y-10 -mt-6 relative z-10">
      {notes.length > 0 && (
        <div className="bg-zinc-900 p-6 rounded-[32px] border border-emerald-500/30 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <h3 className="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center">
            <ClipboardList className="w-4 h-4 mr-2" />
            Mensagem do Treinador
          </h3>
          <div className="space-y-3 relative z-10">
            {notes.slice(0, 2).map((note, i) => (
              <div key={i} className="bg-black/50 p-4 rounded-2xl border border-zinc-800">
                <p className="text-sm text-zinc-300 italic">"{note.note}"</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions with Images */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'run', icon: Timer, label: 'CORRIDA', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=2070&auto=format&fit=crop', color: 'emerald' },
          { id: 'bodybuilding', icon: Dumbbell, label: 'MUSCULAÇÃO', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop', color: 'zinc' },
          { id: 'crossfit', icon: ActivityIcon, label: 'CROSSFIT', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop', color: 'orange' }
        ].map((action, idx) => (
          <motion.button 
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setView(action.id as any)}
            className="relative h-36 rounded-[32px] overflow-hidden group active:scale-95 transition-transform shadow-xl"
          >
            <img 
              src={action.img} 
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
              alt={action.label}
              referrerPolicy="no-referrer"
            />
            <div className={`absolute inset-0 bg-${action.color}-500/20 group-hover:bg-black/40 transition-colors`} />
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
              <div className="p-2 bg-black/40 backdrop-blur-md rounded-2xl">
                <action.icon className={`w-7 h-7 ${action.color === 'orange' ? 'text-orange-500' : 'text-emerald-500'} drop-shadow-lg`} />
              </div>
              <span className="text-white font-black text-[10px] tracking-[0.15em] drop-shadow-lg">{action.label}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {user?.role === 'trainer' && (
        <button 
          onClick={() => setView('instructor')}
          className="w-full bg-zinc-900 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Portal do Instrutor</p>
              <p className="text-zinc-500 text-[10px]">Gerir alunos e evoluções</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600" />
        </button>
      )}

      {/* Motivational Card - NEW */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-emerald-500 p-8 rounded-[40px] relative overflow-hidden shadow-lg shadow-emerald-500/20"
      >
        <img 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          alt="Motivation"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10">
          <p className="text-black font-black italic text-2xl tracking-tighter leading-tight mb-4">"A DISCIPLINA É A PONTE ENTRE METAS E REALIZAÇÕES."</p>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-1 bg-black rounded-full" />
            <span className="text-black text-[10px] font-black uppercase tracking-widest">Foco Total</span>
          </div>
        </div>
      </motion.div>

      {/* Active Challenge */}
      {dashboardData?.challenge && (
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-black text-xl italic uppercase tracking-tighter">DESAFIO ATIVO</h3>
                <p className="text-emerald-100 text-sm mt-1">{dashboardData.challenge.title}</p>
              </div>
              <Trophy className="w-10 h-10 text-emerald-200 opacity-50" />
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-emerald-100 mb-2">
                <span>Progresso: {dashboardData.challenge.progress || 0}/{dashboardData.challenge.target_value}</span>
                <span>{Math.round(((dashboardData.challenge.progress || 0) / dashboardData.challenge.target_value) * 100)}%</span>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((dashboardData.challenge.progress || 0) / dashboardData.challenge.target_value) * 100}%` }}
                  className="h-full bg-white"
                />
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
        </div>
      )}

      {/* Ranking */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Top 50 Guerreiros</h3>
            <div className="px-2 py-0.5 bg-emerald-500/10 rounded-full">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Elite</span>
            </div>
          </div>
          <button 
            onClick={() => setView('ranking')}
            className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            Ver Todos
          </button>
        </div>
        <div className="space-y-2">
          {dashboardData?.ranking?.slice(0, 50).map((entry, i) => (
            <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl flex items-center justify-between border border-zinc-800/50">
              <div className="flex items-center space-x-4">
                <div className="relative w-6 flex justify-center">
                  <span className={`text-lg font-black ${i === 0 ? 'text-emerald-500' : i === 1 ? 'text-orange-400' : i === 2 ? 'text-zinc-400' : 'text-zinc-600'}`}>{i + 1}</span>
                  {i === 0 && <Trophy className="w-4 h-4 text-yellow-500 absolute -top-3 -left-3 rotate-[-20deg]" />}
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  {entry.photo ? (
                    <img src={entry.photo} className="w-full h-full object-cover" alt={entry.name} referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-black italic tracking-tight text-sm leading-tight">{entry.name?.toUpperCase()}</p>
                  {entry.registration_number && (
                    <p className="text-[9px] font-black text-emerald-500/60 tracking-widest uppercase">ID: {entry.registration_number}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-emerald-500 font-black text-sm leading-none">{entry.score}</p>
                  <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Kcal</p>
                </div>
                {i === 0 && <Medal className="w-5 h-5 text-yellow-500" />}
                {i === 1 && <Medal className="w-5 h-5 text-orange-400" />}
                {i === 2 && <Medal className="w-5 h-5 text-zinc-400" />}
              </div>
            </div>
          ))}
          {dashboardData?.ranking && dashboardData.ranking.length > 50 && (
            <div className="py-8 text-center">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Apenas o Top 50 entra na Elite</p>
              <button 
                onClick={() => setView('ranking')}
                className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                Lutar para subir no Ranking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Bottom Nav */}
    <BottomNav currentView="dashboard" setView={setView} user={user} />
  </div>
  );
};

interface WeeklyViewProps {
  key?: string;
  dashboardData: DashboardData | null;
  setView: (view: any) => void;
}

const WeeklyView = ({ dashboardData, setView }: WeeklyViewProps) => {
  return (
    <div className="min-h-screen text-white pb-24">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
          alt="Weekly Hero" 
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-emerald-400 text-sm font-black uppercase tracking-[0.2em] mb-1 drop-shadow-lg">PONTOC FIT</h2>
            <p className="text-4xl font-black italic tracking-tighter leading-none">SEMANA</p>
          </motion.div>
        </div>
      </div>

      <div className="p-6 space-y-10 relative z-10">
        {/* Stats Summary */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 rounded-[40px] p-8 border border-zinc-800 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Resumo da Semana</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-orange-500/20 rounded-[24px]">
                <Flame className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-black italic tracking-tighter">{dashboardData?.stats?.total_calories || 0}</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase">Kcal Queimadas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-emerald-500/20 rounded-[24px]">
                <ActivityIcon className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-3xl font-black italic tracking-tighter">{dashboardData?.stats?.total_workouts || 0}</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase">Treinos Feitos</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Featured Exercises Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">6 Exercícios em Destaque da Semana</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Supino Reto', kcal: '120', reps: '3x12' },
              { title: 'Agachamento', kcal: '150', reps: '4x10' },
              { title: 'Burpees', kcal: '200', reps: '3x15' },
              { title: 'Levantamento Terra', kcal: '180', reps: '3x8' },
              { title: 'Flexão de Braços', kcal: '90', reps: '3x20' },
              { title: 'Prancha Abdominal', kcal: '60', reps: '3x60s' }
            ].map((ex, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02 }}
                className="bg-zinc-900 p-4 rounded-[24px] border border-zinc-800/50 flex flex-col justify-between"
              >
                <div>
                  <p className="font-black italic text-xs tracking-tighter mb-1">{ex.title.toUpperCase()}</p>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase">{ex.reps}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-emerald-500 text-[10px] font-black">{ex.kcal} KCAL</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav currentView="weekly" setView={setView} user={user} />
    </div>
  );
};

interface RunViewProps {
  key?: string;
  user: User | null;
  setView: (view: any) => void;
  fetchDashboard: () => void;
}

const RunView = ({ user, setView, fetchDashboard }: RunViewProps) => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 1);
        setDistance(d => d + 0.002); // Simulated distance
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveActivity = async () => {
    const calories = Math.round(distance * 60); // Simple calc
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user?.id,
        type: 'run',
        data: { time, distance: distance.toFixed(2) },
        calories
      })
    });
    fetchDashboard();
    setView('dashboard');
  };

  return (
    <div className="min-h-screen text-white p-6 flex flex-col relative overflow-hidden">
      {/* Run Header Image */}
      <div className="absolute top-0 left-0 right-0 h-48 z-0">
        <img 
          src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-30"
          alt="Run BG"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
      </div>

      <div className="flex items-center space-x-4 mb-12 relative z-10">
        <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">Corrida / Caminhada</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12 relative z-10">
        <div className="text-center">
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-2">Tempo Total</p>
          <p className="text-7xl font-black tracking-tighter tabular-nums">{formatTime(time)}</p>
        </div>

        <div className="grid grid-cols-2 gap-12 w-full max-w-xs">
          <div className="text-center">
            <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-1">Distância</p>
            <p className="text-3xl font-bold">{distance.toFixed(2)} <span className="text-sm text-emerald-500">KM</span></p>
          </div>
          <div className="text-center">
            <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-1">Calorias</p>
            <p className="text-3xl font-bold">{Math.round(distance * 60)} <span className="text-sm text-orange-500">KCAL</span></p>
          </div>
        </div>

        <div className="flex space-x-6">
          {!isActive ? (
            <button 
              onClick={() => setIsActive(true)}
              className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-10 h-10 text-black fill-current" />
            </button>
          ) : (
            <button 
              onClick={() => setIsActive(false)}
              className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center"
            >
              <Square className="w-10 h-10 text-white fill-current" />
            </button>
          )}
        </div>
      </div>

      {time > 0 && !isActive && (
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={saveActivity}
          className="w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl mb-8 relative z-10"
        >
          SALVAR ATIVIDADE
        </motion.button>
      )}
    </div>
  );
};

interface BodybuildingViewProps {
  key?: string;
  user: User | null;
  setView: (view: any) => void;
  fetchDashboard: () => void;
}

const BodybuildingView = ({ user, setView, fetchDashboard }: BodybuildingViewProps) => {
  const [step, setStep] = useState<'group' | 'details'>('group');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [exercise, setExercise] = useState({ name: '', weight: '', sets: '', reps: '' });

  const groups = [
    { name: 'Peito', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop' },
    { name: 'Ombro', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop' },
    { name: 'Bíceps', img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=2070&auto=format&fit=crop' },
    { name: 'Tríceps', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop' },
    { name: 'Costas', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=2070&auto=format&fit=crop' },
    { name: 'Pernas', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop' }
  ];

  const saveWorkout = async () => {
    const calories = parseInt(exercise.sets) * parseInt(exercise.reps) * 0.5; // Simple calc
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user?.id,
        type: 'bodybuilding',
        data: { group: selectedGroup, ...exercise },
        calories
      })
    });
    fetchDashboard();
    setView('dashboard');
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24 relative overflow-hidden">
      {/* Bodybuilding Header Image */}
      <div className="absolute top-0 left-0 right-0 h-48 z-0">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-50"
          alt="Bodybuilding BG"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => step === 'details' ? setStep('group') : setView('dashboard')} className="p-2 bg-zinc-900/80 backdrop-blur-md rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter">MUSCULAÇÃO</h2>
        </div>

      {step === 'group' ? (
        <div className="space-y-6">
          {/* Featured Bodybuilding Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-56 rounded-[40px] overflow-hidden border border-emerald-500/20 shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
              className="w-full h-full object-cover"
              alt="Bodybuilding Featured"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-8">
              <p className="text-emerald-500 font-black text-xs tracking-[0.2em] mb-1">TREINO DO DIA</p>
              <h3 className="text-2xl font-black italic tracking-tighter">FORÇA TOTAL</h3>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {groups.map(g => (
            <motion.button 
              key={g.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelectedGroup(g.name); setStep('details'); }}
              className="relative h-40 rounded-3xl overflow-hidden group border border-zinc-800"
            >
              <img src={g.img} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt={g.name} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-xl font-black italic tracking-tighter">{g.name.toUpperCase()}</span>
              </div>
            </motion.button>
          ))}
          </div>

          {/* Training Tip Section */}
          <div className="bg-zinc-900/50 rounded-[32px] p-6 border border-zinc-800/50 flex items-center space-x-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover"
                alt="Tip"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-emerald-500 font-black text-[10px] tracking-[0.2em] mb-1 uppercase">Dica do Instrutor</p>
              <p className="text-sm font-bold text-zinc-300">"A constância é o segredo do resultado. Não falte hoje!"</p>
            </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="relative h-48 rounded-[32px] overflow-hidden border border-emerald-500/30">
            <img 
              src={groups.find(g => g.name === selectedGroup)?.img} 
              className="w-full h-full object-cover opacity-60" 
              alt={selectedGroup}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div className="absolute bottom-6 left-6">
              <p className="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-1">Treino de Hoje</p>
              <p className="text-3xl font-black italic tracking-tighter">{selectedGroup.toUpperCase()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nome do Exercício (ex: Supino)" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
              value={exercise.name}
              onChange={e => setExercise({...exercise, name: e.target.value})}
            />
            <div className="grid grid-cols-3 gap-4">
              <input 
                type="number" 
                placeholder="Peso (kg)" 
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                value={exercise.weight}
                onChange={e => setExercise({...exercise, weight: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Séries" 
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                value={exercise.sets}
                onChange={e => setExercise({...exercise, sets: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Reps" 
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                value={exercise.reps}
                onChange={e => setExercise({...exercise, reps: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={saveWorkout}
            className="w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>SALVAR TREINO</span>
          </button>
        </motion.div>
      )}
      </div>
    </div>
  );
};

interface ProfileViewProps {
  key?: string;
  user: User | null;
  setUser: (user: User | null) => void;
  setView: (view: any) => void;
  logout: () => void;
}

const ProfileView = ({ user, setUser, setView, logout }: ProfileViewProps) => {
  const [profile, setProfile] = useState({
    weight: user?.weight || '',
    height: user?.height || '',
    age: user?.age || '',
    goal: user?.goal || 'manter',
    photo: user?.photo || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async () => {
    await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user?.id, ...profile })
    });
    const updatedUser = { ...user!, ...profile };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    showToast("Perfil atualizado!");
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24 relative overflow-hidden">
      {/* Profile Header with Image */}
      <div className="absolute top-0 left-0 right-0 h-48 z-0">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-30"
          alt="Profile BG"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-4">
            <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900/80 backdrop-blur-md rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter">MEU PERFIL</h2>
          </div>
          <button onClick={logout} className="p-3 bg-red-500/10 text-red-500 rounded-2xl backdrop-blur-md border border-red-500/20">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-28 h-28 bg-emerald-500 rounded-[32px] p-1 shadow-2xl shadow-emerald-500/20 mb-4 overflow-hidden">
              <div className="w-full h-full bg-zinc-900 rounded-[28px] flex items-center justify-center overflow-hidden">
                {profile.photo ? (
                  <img src={profile.photo} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-12 h-12 text-emerald-500" />
                )}
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-0 p-2 bg-emerald-500 rounded-xl border-4 border-black text-black hover:scale-110 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          <h3 className="text-2xl font-black italic tracking-tighter">{user?.name?.toUpperCase()}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{user?.role === 'trainer' ? 'Treinador' : 'Aluno'} • Luanda, AO</p>
          </div>
          {user?.registration_number && (
            <div className="mt-4 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full">
              <p className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase">Cadastro: {user.registration_number}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Peso (kg)</label>
              <input 
                type="number" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                value={profile.weight}
                onChange={e => setProfile({...profile, weight: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Altura (cm)</label>
              <input 
                type="number" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                value={profile.height}
                onChange={e => setProfile({...profile, height: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Idade</label>
            <input 
              type="number" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 focus:outline-none focus:border-emerald-500 transition-all font-bold"
              value={profile.age}
              onChange={e => setProfile({...profile, age: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Objetivo Principal</label>
            <div className="grid grid-cols-3 gap-2">
              {['perder', 'manter', 'ganhar'].map(g => (
                <button
                  key={g}
                  onClick={() => setProfile({...profile, goal: g})}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${profile.goal === g ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                >
                  {g === 'perder' ? 'Secar' : g === 'manter' ? 'Manter' : 'Crescer'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={updateProfile}
            className="w-full bg-white text-black font-black py-5 rounded-[24px] tracking-[0.2em] text-xs uppercase shadow-xl active:scale-95 transition-all mt-4"
          >
            ATUALIZAR DADOS
          </button>
        </div>
      </div>
    </div>
  );
};

interface RecipesViewProps {
  key?: string;
  setView: (view: any) => void;
}

const RecipesView = ({ setView }: RecipesViewProps) => {
  const [activeTab, setActiveTab] = useState<'emagrecer' | 'ganhar_massa'>('emagrecer');
  const [selectedRecipeForHelp, setSelectedRecipeForHelp] = useState<Recipe | null>(null);
  const [helpContent, setHelpContent] = useState<string>('');
  const [isGeneratingHelp, setIsGeneratingHelp] = useState(false);

  const getCookingHelp = async (recipe: Recipe) => {
    setSelectedRecipeForHelp(recipe);
    setIsGeneratingHelp(true);
    setHelpContent('');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Dê 3 dicas de mestre (em português de Angola, se possível) para elevar o nível desta receita: ${recipe.title}. 
        Ingredientes: ${recipe.ingredients.join(', ')}. 
        Instruções originais: ${recipe.instructions}. 
        Seja breve, motivador e use gírias de ginásio.`,
      });
      setHelpContent(response.text || 'O Chef está sem palavras hoje!');
    } catch (error) {
      console.error(error);
      setHelpContent('Não consegui carregar as dicas extras, mas foca no plano!');
    } finally {
      setIsGeneratingHelp(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter">RECEITAS FIT</h2>
        </div>
        <ChefHat className="w-6 h-6 text-emerald-500" />
      </div>

      {/* Category Tabs with Images */}
      <div className="flex bg-zinc-900 p-1 rounded-[24px] border border-zinc-800 mb-10">
        <button 
          onClick={() => setActiveTab('emagrecer')}
          className={`flex-1 py-4 rounded-[20px] font-black italic tracking-tighter text-sm transition-all flex items-center justify-center space-x-2 ${activeTab === 'emagrecer' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500'}`}
        >
          <Flame className="w-4 h-4" />
          <span>PARA SECAR</span>
        </button>
        <button 
          onClick={() => setActiveTab('ganhar_massa')}
          className={`flex-1 py-4 rounded-[20px] font-black italic tracking-tighter text-sm transition-all flex items-center justify-center space-x-2 ${activeTab === 'ganhar_massa' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-zinc-500'}`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>GANHAR MASSA</span>
        </button>
      </div>
      
      <div className="space-y-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-8"
          >
            {ANGOLAN_RECIPES.filter(r => r.category === activeTab).map((recipe, idx) => (
              <motion.div 
                key={recipe.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-zinc-900 border border-zinc-800 rounded-[40px] overflow-hidden group shadow-2xl"
              >
                <div className="h-56 relative overflow-hidden">
                  <img 
                    src={`https://images.unsplash.com/photo-${idx % 2 === 0 ? '1546069901-ba9599a7e63c' : '1490645935967-10de6ba17061'}?q=80&w=2080&auto=format&fit=crop`} 
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      {activeTab === 'emagrecer' ? 'Low Carb' : 'High Protein'}
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-8">
                    <h4 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-2xl">{recipe.title}</h4>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Ingredientes</p>
                      <ul className="text-xs text-zinc-400 space-y-2">
                        {recipe.ingredients.slice(0, 4).map((ing, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1" />
                            <span>{ing}</span>
                          </li>
                        ))}
                        {recipe.ingredients.length > 4 && <li className="italic opacity-50 pl-4">e mais {recipe.ingredients.length - 4} itens...</li>}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Tempo</p>
                        <div className="flex items-center space-x-2 text-zinc-300">
                          <Timer className="w-5 h-5 text-emerald-500" />
                          <span className="text-base font-black italic tracking-tighter">35 MIN</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em]">Calorias</p>
                        <div className="flex items-center space-x-2 text-zinc-300">
                          <Flame className="w-5 h-5 text-orange-500" />
                          <span className="text-base font-black italic tracking-tighter">420 KCAL</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800/50">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Modo de Preparo</p>
                    <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 italic">{recipe.instructions}</p>
                  </div>

                  <button 
                    onClick={() => getCookingHelp(recipe)}
                    className="w-full py-5 bg-zinc-800 hover:bg-emerald-500 hover:text-black transition-all duration-300 rounded-[24px] text-xs font-black tracking-[0.2em] uppercase shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>COZINHAR AGORA</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cooking Help Modal */}
      <AnimatePresence>
        {selectedRecipeForHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-[40px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <ChefHat className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">AJUDA DO CHEF</h3>
                </div>
                <button 
                  onClick={() => setSelectedRecipeForHelp(null)}
                  className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="p-6 bg-zinc-800/50 rounded-3xl border border-zinc-700/50">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Passo-a-Passo Original</p>
                  <p className="text-sm font-medium italic text-zinc-300 leading-relaxed">{selectedRecipeForHelp.instructions}</p>
                </div>

                <div className="p-6 bg-zinc-800/30 rounded-3xl border border-dashed border-zinc-700">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center">
                    <Trophy className="w-3 h-3 mr-2" />
                    Dicas de Mestre (IA)
                  </p>
                  {isGeneratingHelp ? (
                    <div className="flex items-center space-x-4 py-4">
                      <div className="w-5 h-5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                      <p className="text-[10px] font-black italic text-zinc-500 animate-pulse uppercase">O Chef está a preparar os segredos...</p>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-zinc-400 text-xs leading-relaxed italic whitespace-pre-wrap"
                    >
                      {helpContent}
                    </motion.div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedRecipeForHelp(null)}
                  className="w-full py-5 bg-emerald-500 text-black font-black rounded-[24px] tracking-[0.2em] text-xs uppercase shadow-xl active:scale-95 transition-all sticky bottom-0"
                >
                  VAMOS À COZINHA!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface HistoryViewProps {
  key?: string;
  user: User | null;
  setView: (view: any) => void;
}

const HistoryView = ({ user, setView }: HistoryViewProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch(`/api/activities/${user?.id}`);
      const data = await res.json();
      setActivities(data);
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black italic tracking-tighter">HISTÓRICO</h2>
      </div>
      <div className="space-y-4">
        {activities.length === 0 && <p className="text-zinc-500 text-center py-12">Nenhuma atividade registada ainda.</p>}
        {activities.map(act => {
          const data = JSON.parse(act.data);
          return (
            <div key={act.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${act.type === 'run' ? 'bg-emerald-500/10 text-emerald-500' : act.type === 'crossfit' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {act.type === 'run' ? <Timer className="w-6 h-6" /> : act.type === 'crossfit' ? <ActivityIcon className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold capitalize">{act.type === 'run' ? 'Corrida' : act.type === 'crossfit' ? 'CrossFit' : `Musculação (${data.group})`}</p>
                  <p className="text-zinc-500 text-xs">{new Date(act.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-500 font-bold">+{act.calories} <span className="text-[10px] text-zinc-500">KCAL</span></p>
                <p className="text-zinc-500 text-xs">{act.type === 'run' ? `${data.distance} km` : act.type === 'crossfit' ? `${data.rounds} rounds` : `${data.sets} séries`}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CrossFitView = ({ user, setView, fetchDashboard }: RunViewProps) => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [rounds, setRounds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveActivity = async () => {
    const calories = Math.round(time * 0.2 + rounds * 15); // Simple calc
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user?.id,
        type: 'crossfit',
        data: { time, rounds },
        calories
      })
    });
    fetchDashboard();
    setView('dashboard');
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24 relative overflow-hidden">
      {/* CrossFit Header Image */}
      <div className="absolute top-0 left-0 right-0 h-48 z-0">
        <img 
          src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-30"
          alt="CrossFit BG"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
      </div>

      <div className="flex items-center space-x-4 mb-8 relative z-10">
        <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">CrossFit</h2>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="bg-zinc-900 rounded-[40px] p-12 text-center border border-zinc-800">
          <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">Tempo Total</p>
          <h3 className="text-7xl font-black italic text-emerald-500">{formatTime(time)}</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex flex-col items-center">
            <p className="text-zinc-500 text-sm uppercase tracking-widest mb-2">Rounds / Reps</p>
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => setRounds(Math.max(0, rounds - 1))}
                className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold"
              >
                -
              </button>
              <span className="text-5xl font-black">{rounds}</span>
              <button 
                onClick={() => setRounds(rounds + 1)}
                className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center text-2xl font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`flex-1 py-6 rounded-3xl font-black text-lg flex items-center justify-center space-x-3 ${isActive ? 'bg-zinc-800 text-white' : 'bg-emerald-500 text-black'}`}
          >
            {isActive ? <><Square className="w-6 h-6" /> <span>PAUSAR</span></> : <><Play className="w-6 h-6" /> <span>INICIAR</span></>}
          </button>
          {!isActive && time > 0 && (
            <button 
              onClick={saveActivity}
              className="flex-1 bg-white text-black py-6 rounded-3xl font-black text-lg flex items-center justify-center space-x-3"
            >
              <Save className="w-6 h-6" />
              <span>GUARDAR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const InstructorView = ({ user, setView }: { key?: string, user: User | null, setView: (v: any) => void }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', phone: '', password: '123', photo: '' });
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [evolution, setEvolution] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
    fetchNotifications();
    fetchTrainerData();
  }, []);

  const fetchTrainerData = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/trainer/${user.id}`);
    const data = await res.json();
    if (data) setTrainer(data);
  };

  const generateInviteLink = async () => {
    if (!trainer) return;
    const res = await fetch(`/api/trainer/invite-link/${trainer.id}`, {
      headers: { 'X-User-Id': user?.id?.toString() || '' }
    });
    if (res.ok) {
      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.invite_link}`;
      setInviteLink(fullUrl);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast('Link copiado!');
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/trainer/notifications/${user.id}`, {
      headers: { 'X-User-Id': user.id.toString() }
    });
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    await fetch(`/api/trainer/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'X-User-Id': user?.id?.toString() || '' }
    });
    fetchNotifications();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudent({ ...newStudent, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchStudents = async () => {
    const res = await fetch(`/api/instructor/students/${user?.id}`, {
      headers: { 'X-User-Id': user?.id?.toString() || '' }
    });
    const data = await res.json();
    setStudents(data);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/instructor/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id?.toString() || '' },
      body: JSON.stringify({ ...newStudent, instructor_id: user?.id })
    });
    if (res.ok) {
      setShowAdd(false);
      setNewStudent({ name: '', phone: '', password: '123' });
      fetchStudents();
    } else {
      const data = await res.json();
      showToast(data.error, true);
    }
  };

  const viewEvolution = async (student: User) => {
    setSelectedStudent(student);
    const res = await fetch(`/api/student/evolution/${student.id}`, {
      headers: { 'X-User-Id': user?.id?.toString() || '' }
    });
    const data = await res.json();
    setEvolution(data);
  };

  const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Portal Instrutor</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-3 bg-zinc-900 rounded-2xl relative"
          >
            <Bell className="w-6 h-6 text-emerald-500" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900" />
            )}
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="p-3 bg-emerald-500 rounded-2xl text-black shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {trainer && (
        <div className="bg-emerald-500 p-6 rounded-[32px] mb-8 relative overflow-hidden shadow-lg shadow-emerald-500/20">
          <div className="relative z-10 flex justify-between items-center mb-4">
            <div>
              <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-1">Seu Código de Treinador</p>
              <p className="text-3xl font-black italic tracking-tighter text-black font-mono">{trainer.trainer_code}</p>
            </div>
            <QrCode className="w-10 h-10 text-black/20" />
          </div>
          
          <div className="relative z-10 border-t border-black/10 pt-4 mt-2">
            {!inviteLink ? (
              <button 
                onClick={generateInviteLink}
                className="w-full bg-black text-emerald-500 font-black py-3 rounded-xl tracking-widest text-xs uppercase"
              >
                Gerar link de convite
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-black/80 text-xs font-bold">Link de convite do treinador</p>
                <div className="flex items-center space-x-2 bg-black/10 p-2 rounded-lg">
                  <p className="text-black font-mono text-xs truncate flex-1">{inviteLink}</p>
                  <button 
                    onClick={copyInviteLink}
                    className="bg-black text-emerald-500 px-3 py-2 rounded-md text-xs font-bold uppercase"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructor Stats Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 p-6 rounded-[32px] border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Alunos</p>
          <p className="text-3xl font-black italic tracking-tighter text-emerald-500">{students.length}</p>
        </div>
        <button 
          onClick={() => setView('trainer-sales')}
          className="bg-zinc-900 p-6 rounded-[32px] border border-emerald-500/30 text-left active:scale-95 transition-transform"
        >
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Minhas Vendas</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-black italic tracking-tighter text-emerald-500">VER LOJA</p>
            <ShoppingBag className="w-5 h-5 text-emerald-500" />
          </div>
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input 
          type="text"
          placeholder="Procurar aluno pelo nome..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 pl-12 focus:outline-none focus:border-emerald-500 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredStudents.map((student, idx) => (
          <motion.button 
            key={student.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => viewEvolution(student)}
            className="w-full bg-zinc-900/50 border border-zinc-800 p-5 rounded-[28px] flex items-center justify-between active:scale-[0.98] transition-all hover:bg-zinc-900"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-700">
                {student.photo ? (
                  <img src={student.photo} className="w-full h-full object-cover" alt={student.name} referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-black text-emerald-500 text-xl italic">{student.name?.charAt(0)}</span>
                )}
              </div>
              <div className="text-left">
                <p className="font-black italic tracking-tight text-lg leading-tight">{student.name?.toUpperCase()}</p>
                <div className="flex flex-col space-y-0.5 mt-1">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">ID: {student.registration_number || 'N/A'}</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-zinc-500 text-xs font-medium">{student.phone}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-zinc-800 rounded-xl">
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[32px] p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Registar Novo Aluno</h3>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 bg-black border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden hover:border-emerald-500 transition-colors"
                  >
                    {newStudent.photo ? (
                      <img src={newStudent.photo} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <Plus className="w-6 h-6 text-zinc-500" />
                    )}
                  </button>
                  <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-widest">Foto do Aluno</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                <input 
                  type="text"
                  placeholder="Nome do Aluno"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  required
                />
                <input 
                  type="tel"
                  placeholder="Telefone"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newStudent.phone}
                  onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                  required
                />
                <div className="flex space-x-3">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-4 rounded-xl bg-zinc-800 font-bold"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-bold"
                  >
                    REGISTAR
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evolution Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 bg-black z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-8">
                <button onClick={() => setSelectedStudent(null)} className="p-2 bg-zinc-900 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-zinc-500 text-sm">Evolução do Aluno</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-zinc-500 text-xs uppercase mb-1">Peso</p>
                  <p className="text-xl font-bold">{selectedStudent.weight || '--'} kg</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-zinc-500 text-xs uppercase mb-1">Objetivo</p>
                  <p className="text-xl font-bold capitalize">{selectedStudent.goal || '--'}</p>
                </div>
              </div>

              <h3 className="font-bold mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span>Atividades Recentes</span>
              </h3>

              <div className="space-y-3">
                {evolution.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">Nenhuma atividade registada.</p>
                ) : (
                  evolution.map(act => {
                    const data = JSON.parse(act.data);
                    return (
                      <div key={act.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${act.type === 'run' ? 'bg-emerald-500/10 text-emerald-500' : act.type === 'crossfit' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {act.type === 'run' ? <Timer className="w-6 h-6" /> : act.type === 'crossfit' ? <ActivityIcon className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-bold capitalize">{act.type === 'run' ? 'Corrida' : act.type === 'crossfit' ? 'CrossFit' : `Musculação (${data.group})`}</p>
                            <p className="text-zinc-500 text-xs">{new Date(act.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-500 font-bold">+{act.calories} KCAL</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 bg-black z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button onClick={() => setShowNotifications(false)} className="p-2 bg-zinc-900 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Notificações</h2>
              </div>
              <Bell className="w-6 h-6 text-emerald-500" />
            </div>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhuma notificação.</p>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`bg-zinc-900 p-4 rounded-2xl border ${notif.is_read ? 'border-zinc-800' : 'border-emerald-500/50'} flex items-start justify-between`}
                    onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl ${notif.is_read ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        <Bell className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`font-medium ${notif.is_read ? 'text-zinc-400' : 'text-white'}`}>{notif.message}</p>
                        <p className="text-zinc-500 text-xs mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface RankingViewProps {
  key?: string;
  dashboardData: DashboardData | null;
  setView: (view: any) => void;
}

const RankingView = ({ dashboardData, setView }: RankingViewProps) => {
  const [search, setSearch] = useState('');
  
  const filteredRanking = dashboardData?.ranking?.filter(entry => 
    (entry.name || '').toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">RANKING GERAL</h2>
        </div>
        <Trophy className="w-6 h-6 text-emerald-500" />
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input 
          type="text"
          placeholder="Procurar guerreiro..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 pl-12 focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredRanking.map((entry, i) => {
          const originalIndex = dashboardData?.ranking?.findIndex(r => r.name === entry.name) ?? i;
          const isTop50 = originalIndex < 50;

          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className={`p-4 rounded-[28px] flex items-center justify-between border transition-all ${isTop50 ? 'bg-zinc-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-zinc-900/30 border-zinc-800 opacity-80'}`}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative w-8 flex justify-center flex-shrink-0">
                  <span className={`text-xl font-black ${originalIndex === 0 ? 'text-emerald-500' : originalIndex === 1 ? 'text-orange-400' : originalIndex === 2 ? 'text-zinc-400' : isTop50 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {originalIndex + 1}
                  </span>
                  {originalIndex === 0 && <Trophy className="w-4 h-4 text-yellow-500 absolute -top-3 -left-3 rotate-[-20deg]" />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-black italic tracking-tight text-base leading-tight uppercase truncate">{entry.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">ID: {entry.registration_number || '---'}</p>
                    {isTop50 && (
                      <div className="px-1.5 py-0.5 bg-emerald-500/10 rounded-md">
                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">ELITE</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  {entry.photo ? (
                    <img src={entry.photo} className="w-full h-full object-cover" alt={entry.name} referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-emerald-500 font-black text-lg leading-none">{entry.score}</p>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Kcal</p>
                </div>
                {originalIndex < 3 && (
                  <Medal className={`w-6 h-6 ${originalIndex === 0 ? 'text-yellow-500' : originalIndex === 1 ? 'text-orange-400' : 'text-zinc-400'}`} />
                )}
              </div>
            </motion.div>
          );
        })}
        {filteredRanking.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-500 font-black italic uppercase tracking-widest">Nenhum guerreiro encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TrainerView = ({ user, setView }: { key?: string, user: User | null, setView: (v: any) => void }) => {
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [trainerCode, setTrainerCode] = useState('');

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchTrainerData();
    }
  }, [user]);

  const fetchTrainerData = async () => {
    const res = await fetch(`/api/trainer/${user?.id}`);
    const data = await res.json();
    if (data) {
      setTrainer(data);
      const studentsRes = await fetch(`/api/trainer/students-list/${data.id}`, {
        headers: { 'X-User-Id': user?.id?.toString() || '' }
      });
      const studentsData = await studentsRes.json();
      setStudents(studentsData);
    }
  };

  const joinTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/student/join-trainer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user?.id, trainer_code: trainerCode })
    });
    if (res.ok) {
      showToast('Vinculado ao treinador com sucesso!');
      setShowJoin(false);
    } else {
      const data = await res.json();
      showToast(data.error, true);
    }
  };

  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [note, setNote] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const generateInviteLink = async () => {
    if (!trainer) return;
    const res = await fetch(`/api/trainer/invite-link/${trainer.id}`, {
      headers: { 'X-User-Id': user?.id?.toString() || '' }
    });
    if (res.ok) {
      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.invite_link}`;
      setInviteLink(fullUrl);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast('Link copiado!');
  };

  const sendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !trainer) return;
    const res = await fetch('/api/trainer/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id?.toString() || '' },
      body: JSON.stringify({ trainer_id: trainer.id, student_id: selectedStudent.id, note })
    });
    if (res.ok) {
      showToast('Nota enviada com sucesso!');
      setNote('');
      setSelectedStudent(null);
    }
  };

  const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(search.toLowerCase()));

  if (user?.role !== 'trainer') {
    return (
      <div className="min-h-screen text-white p-6 pb-24">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Área do Treinador</h2>
        </div>

        <div className="mt-8 bg-zinc-900 p-8 rounded-[32px] border border-zinc-800 text-center space-y-6">
          <h3 className="text-xl font-black italic uppercase">Já tem um treinador?</h3>
          {showJoin ? (
            <form onSubmit={joinTrainer} className="space-y-4">
              <input 
                type="text" 
                placeholder="Código do Treinador (ex: TR-12345)" 
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-center font-mono uppercase focus:border-emerald-500 focus:outline-none"
                value={trainerCode}
                onChange={e => setTrainerCode(e.target.value)}
                required
              />
              <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl tracking-widest text-xs uppercase">
                Vincular
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setShowJoin(true)}
              className="w-full bg-zinc-800 text-white font-black py-4 rounded-2xl tracking-widest text-xs uppercase"
            >
              Inserir Código
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Painel do Treinador</h2>
        </div>
      </div>

      <div className="bg-emerald-500 p-6 rounded-[32px] mb-8 relative overflow-hidden shadow-lg shadow-emerald-500/20">
        <div className="relative z-10 flex justify-between items-center mb-4">
          <div>
            <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-1">Seu Código de Treinador</p>
            <p className="text-3xl font-black italic tracking-tighter text-black font-mono">{trainer?.trainer_code}</p>
          </div>
          <QrCode className="w-10 h-10 text-black/20" />
        </div>
        
        <div className="relative z-10 border-t border-black/10 pt-4 mt-2">
          {!inviteLink ? (
            <button 
              onClick={generateInviteLink}
              className="w-full bg-black text-emerald-500 font-black py-3 rounded-xl tracking-widest text-xs uppercase"
            >
              Gerar link de convite
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-black/80 text-xs font-bold">Link de convite do treinador</p>
              <div className="flex items-center space-x-2 bg-black/10 p-2 rounded-lg">
                <p className="text-black font-mono text-xs truncate flex-1">{inviteLink}</p>
                <button 
                  onClick={copyInviteLink}
                  className="bg-black text-emerald-500 px-3 py-2 rounded-md text-xs font-bold uppercase"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 p-6 rounded-[32px] border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Alunos</p>
          <p className="text-3xl font-black italic tracking-tighter text-emerald-500">{students.length}</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-[32px] border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Ativos Hoje</p>
          <p className="text-3xl font-black italic tracking-tighter text-orange-500">{Math.ceil(students.length * 0.7)}</p>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input 
          type="text"
          placeholder="Procurar aluno..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 pl-12 focus:outline-none focus:border-emerald-500 transition-all font-medium text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Meus Alunos</h3>
        {filteredStudents.map((student, idx) => (
          <button 
            key={idx} 
            onClick={() => setSelectedStudent(student)}
            className="w-full bg-zinc-900/50 p-4 rounded-2xl flex items-center justify-between border border-zinc-800/50 hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                {student.photo ? (
                  <img src={student.photo} className="w-full h-full object-cover" alt={student.name} referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-6 h-6 text-zinc-600" />
                )}
              </div>
              <div className="text-left">
                <p className="font-black italic tracking-tight text-base leading-tight uppercase">{student.name}</p>
                <p className="text-[10px] font-black text-emerald-500/60 tracking-widest uppercase mt-1">{student.goal || 'Sem objetivo'}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        ))}
        {filteredStudents.length === 0 && (
          <p className="text-center text-zinc-500 text-sm py-8">Nenhum aluno encontrado.</p>
        )}
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 bg-black z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSelectedStudent(null)} className="p-2 bg-zinc-900 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Detalhes do Aluno</h2>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-[32px] border border-zinc-800 mb-8 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                {selectedStudent.photo ? (
                  <img src={selectedStudent.photo} className="w-full h-full object-cover" alt={selectedStudent.name} referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-8 h-8 text-zinc-600" />
                )}
              </div>
              <div>
                <p className="font-black italic tracking-tight text-xl leading-tight uppercase">{selectedStudent.name}</p>
                <p className="text-xs font-black text-emerald-500 tracking-widest uppercase mt-1">ID: {selectedStudent.registration_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-8">
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Peso</p>
                <p className="text-lg font-black italic">{selectedStudent.weight || '--'}kg</p>
              </div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Altura</p>
                <p className="text-lg font-black italic">{selectedStudent.height || '--'}cm</p>
              </div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Idade</p>
                <p className="text-lg font-black italic">{selectedStudent.age || '--'}</p>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-[32px] border border-zinc-800 mb-8">
              <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Enviar Nota / Instrução</h3>
              <form onSubmit={sendNote} className="space-y-4">
                <textarea 
                  placeholder="Escreva uma mensagem para o aluno..." 
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-4 focus:outline-none focus:border-emerald-500 transition-all font-medium text-sm min-h-[100px]"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  required
                />
                <button type="submit" className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl tracking-widest text-xs uppercase">
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GymsView = ({ user, setView }: { key?: string, user: User | null, setView: (v: any) => void }) => {
  const [gym, setGym] = useState<Gym | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [gymCode, setGymCode] = useState('');
  const [newGym, setNewGym] = useState({ name: '', location: '' });

  useEffect(() => {
    fetchGymData();
  }, [user]);

  const fetchGymData = async () => {
    const res = await fetch(`/api/gym/user/${user?.id}`);
    const data = await res.json();
    if (data) {
      setGym(data);
      const membersRes = await fetch(`/api/gym/${data.id}/members`);
      const membersData = await membersRes.json();
      setMembers(membersData);
    }
  };

  const createGym = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/gym/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id?.toString() || '' },
      body: JSON.stringify({ ...newGym, owner_id: user?.id })
    });
    if (res.ok) {
      showToast('Ginásio criado com sucesso!');
      setShowCreate(false);
      fetchGymData();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao criar ginásio', true);
    }
  };

  const joinGym = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/gym/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user?.id, gym_code: gymCode })
    });
    if (res.ok) {
      showToast('Entrou no ginásio com sucesso!');
      fetchGymData();
    } else {
      const data = await res.json();
      showToast(data.error, true);
    }
  };

  if (!gym) {
    return (
      <div className="min-h-screen text-white p-6 pb-24">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Ginásios</h2>
        </div>
        
        <div className="space-y-6">
          <div className="bg-zinc-900 p-8 rounded-[32px] border border-zinc-800 text-center space-y-6">
            <Building2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-black italic uppercase">Junte-se a um Ginásio</h3>
            <p className="text-zinc-400 text-sm">Treine com sua equipe, participe de competições e suba no ranking.</p>
            
            {showJoin ? (
              <form onSubmit={joinGym} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Código do Ginásio (ex: GYM-12345)" 
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-center font-mono uppercase focus:border-emerald-500 focus:outline-none"
                  value={gymCode}
                  onChange={e => setGymCode(e.target.value)}
                  required
                />
                <button type="submit" className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl tracking-widest text-xs uppercase">
                  Entrar
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setShowJoin(true)}
                className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl tracking-widest text-xs uppercase shadow-lg shadow-emerald-500/20"
              >
                Inserir Código
              </button>
            )}
          </div>

          {user?.role === 'trainer' && (
            <div className="bg-zinc-900 p-8 rounded-[32px] border border-zinc-800 text-center space-y-6">
              <h3 className="text-xl font-black italic uppercase">É dono de um Ginásio?</h3>
              {showCreate ? (
                <form onSubmit={createGym} className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Nome do Ginásio</label>
                    <input 
                      type="text" 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 focus:outline-none focus:border-emerald-500 transition-all font-bold mt-1"
                      value={newGym.name}
                      onChange={e => setNewGym({...newGym, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Localização</label>
                    <input 
                      type="text" 
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 focus:outline-none focus:border-emerald-500 transition-all font-bold mt-1"
                      value={newGym.location}
                      onChange={e => setNewGym({...newGym, location: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl tracking-widest text-xs uppercase mt-4">
                    Registrar Ginásio
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setShowCreate(true)}
                  className="w-full bg-zinc-800 text-white font-black py-4 rounded-2xl tracking-widest text-xs uppercase"
                >
                  Criar Ginásio
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">{gym.name}</h2>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-[32px] border border-zinc-800 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Localização</p>
            <p className="font-bold">{gym.location}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Membros</p>
            <p className="font-bold text-emerald-500">{members.length}</p>
          </div>
        </div>
        
        <div className="bg-black p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Código de Convite</p>
            <p className="text-xl font-black italic tracking-tighter text-white font-mono">{gym.gym_code}</p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(gym.gym_code);
              showToast('Código copiado!');
            }}
            className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white"
          >
            Copiar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Ranking do Ginásio</h3>
        </div>
        {members.map((member, i) => (
          <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl flex items-center justify-between border border-zinc-800/50">
            <div className="flex items-center space-x-4">
              <div className="relative w-6 flex justify-center">
                <span className={`text-lg font-black ${i === 0 ? 'text-emerald-500' : i === 1 ? 'text-orange-400' : i === 2 ? 'text-zinc-400' : 'text-zinc-600'}`}>{i + 1}</span>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                {member.photo ? (
                  <img src={member.photo} className="w-full h-full object-cover" alt={member.name} referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              <div className="text-left">
                <p className="font-black italic tracking-tight text-sm leading-tight uppercase">{member.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-500 font-black text-sm leading-none">{member.score}</p>
              <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Kcal</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompetitionsView = ({ user, setView }: { key?: string, user: User | null, setView: (v: any) => void }) => {
  const [ranking, setRanking] = useState<GymRankingEntry[]>([]);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    const res = await fetch('/api/competitions/ranking');
    const data = await res.json();
    setRanking(data);
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Competições</h2>
        </div>
        <Trophy className="w-6 h-6 text-emerald-500" />
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[32px] p-8 mb-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h3 className="text-white font-black text-2xl italic uppercase tracking-tighter mb-2">Batalha de Ginásios</h3>
          <p className="text-emerald-100 text-sm">Mostre que o seu ginásio é o mais forte. A pontuação é baseada nas calorias queimadas por todos os membros nesta semana.</p>
        </div>
        <Swords className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-200 opacity-20" />
      </div>

      <div className="space-y-4">
        <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Ranking Semanal</h3>
        {ranking.map((gym, i) => (
          <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl flex items-center justify-between border border-zinc-800/50">
            <div className="flex items-center space-x-4">
              <div className="relative w-8 flex justify-center">
                <span className={`text-xl font-black ${i === 0 ? 'text-emerald-500' : i === 1 ? 'text-orange-400' : i === 2 ? 'text-zinc-400' : 'text-zinc-600'}`}>{i + 1}</span>
                {i === 0 && <Trophy className="w-4 h-4 text-yellow-500 absolute -top-3 -left-3 rotate-[-20deg]" />}
              </div>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="font-black italic tracking-tight text-base leading-tight uppercase">{gym.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-500 font-black text-lg leading-none">{gym.total_score}</p>
              <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Kcal Totais</p>
            </div>
          </div>
        ))}
        {ranking.length === 0 && (
          <p className="text-center text-zinc-500 text-sm py-8">Nenhum ginásio pontuou ainda.</p>
        )}
      </div>
    </div>
  );
};

const InviteView = ({ user, setView, inviteCode }: { key?: string, user: User | null, setView: (v: any) => void, inviteCode: string | null }) => {
  const [loading, setLoading] = useState(false);

  const joinTrainer = async () => {
    if (!inviteCode || !user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/invite/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.id, trainer_code: inviteCode })
      });
      if (res.ok) {
        showToast('Vinculado ao treinador com sucesso!');
        // Remove invite code from URL
        window.history.replaceState({}, document.title, '/');
        setView('dashboard');
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao vincular', true);
      }
    } catch (e) {
      showToast('Erro na conexão', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24 flex flex-col items-center justify-center relative">
      <div className="bg-zinc-900 p-8 rounded-[32px] border border-zinc-800 text-center space-y-6 max-w-sm w-full relative z-10">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <Users className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Convite Especial</h2>
        <p className="text-zinc-400 text-sm">
          Você foi convidado para treinar com um instrutor.
        </p>
        <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Código do Treinador</p>
          <p className="text-xl font-black italic tracking-tighter text-emerald-500 font-mono">{inviteCode}</p>
        </div>
        <button 
          onClick={joinTrainer}
          disabled={loading}
          className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl tracking-widest text-xs uppercase shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Entrar no time do instrutor'}
        </button>
        <button 
          onClick={() => {
            window.history.replaceState({}, document.title, '/');
            setView('dashboard');
          }}
          className="w-full bg-transparent text-zinc-500 font-black py-4 rounded-2xl tracking-widest text-xs uppercase"
        >
          Agora Não
        </button>
      </div>
    </div>
  );
};

const ShopView = ({ user, setView }: { key?: string, user: User | null, setView: (v: any) => void }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const buyProduct = async (productId: number) => {
    if (!user) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: user.id, product_id: productId })
      });
      if (res.ok) {
        showToast("Compra realizada com sucesso! Aguarde o contato do treinador.");
      } else {
        const data = await res.json();
        showToast(data.error || "Erro ao realizar compra", true);
      }
    } catch (e) {
      showToast("Erro na conexão", true);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Loja Fitness</h2>
        </div>
        {user?.role === 'trainer' && (
          <button 
            onClick={() => setView('trainer-sales')}
            className="p-3 bg-emerald-500 rounded-2xl text-black shadow-lg shadow-emerald-500/20"
          >
            <TrendingUp className="w-6 h-6" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 rounded-[32px] overflow-hidden border border-zinc-800 shadow-xl"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={product.photo || "https://images.unsplash.com/photo-1584735975683-20bc247f6156?q=80&w=2070&auto=format&fit=crop"} 
                  className="w-full h-full object-cover"
                  alt={product.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-emerald-500 text-black font-black px-4 py-2 rounded-full text-sm shadow-lg">
                  {product.price} Kz
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black italic tracking-tight uppercase">{product.name}</h3>
                  <p className="text-zinc-500 text-sm mt-1">{product.description}</p>
                </div>
                <button 
                  onClick={() => buyProduct(product.id)}
                  className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
                >
                  COMPRAR AGORA
                </button>
              </div>
            </motion.div>
          ))}
          {products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-zinc-500 font-bold">Nenhum produto disponível no momento.</p>
            </div>
          )}
        </div>
      )}
      <BottomNav currentView="shop" setView={setView} user={user} />
    </div>
  );
};

const TrainerSalesView = ({ user, setView }: { key?: string, user: User | null, setView: (v: any) => void }) => {
  const [salesData, setSalesData] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', photo: '', stock: '10' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch(`/api/trainer/orders/${user?.id}`, {
        headers: { 'X-User-Id': user?.id?.toString() || '' }
      });
      const data = await res.json();
      setSalesData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || ''
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock)
        })
      });
      if (res.ok) {
        setShowAdd(false);
        setNewProduct({ name: '', description: '', price: '', photo: '', stock: '10' });
        showToast("Produto adicionado com sucesso!");
        fetchSales();
      }
    } catch (e) {
      showToast("Erro ao adicionar produto", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('shop')} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Minhas Vendas</h2>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-3 bg-emerald-500 rounded-2xl text-black shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {salesData && (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Total Vendido</p>
              <p className="text-lg font-black text-emerald-500">{salesData.total_sold} Kz</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Comissão</p>
              <p className="text-lg font-black text-orange-500">{salesData.total_commission} Kz</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Líquido</p>
              <p className="text-lg font-black text-emerald-400">{salesData.total_received} Kz</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Histórico de Pedidos</h3>
            {salesData.orders.map((order: any) => (
              <div key={order.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{order.product_name}</p>
                  <p className="text-zinc-500 text-[10px]">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-500 font-black">{order.price} Kz</p>
                  <p className="text-[8px] text-zinc-600 font-bold uppercase">{order.status}</p>
                </div>
              </div>
            ))}
            {salesData.orders.length === 0 && (
              <p className="text-center text-zinc-500 py-10">Nenhuma venda realizada ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[32px] p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Adicionar Produto</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 bg-black border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden hover:border-emerald-500 transition-colors"
                  >
                    {newProduct.photo ? (
                      <img src={newProduct.photo} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <Plus className="w-6 h-6 text-zinc-500" />
                    )}
                  </button>
                  <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-widest">Foto do Produto</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                <input 
                  type="text"
                  placeholder="Nome do Produto"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
                <textarea 
                  placeholder="Descrição"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500 h-24"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number"
                    placeholder="Preço (Kz)"
                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    required
                  />
                  <input 
                    type="number"
                    placeholder="Estoque"
                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500"
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !newProduct.name || !newProduct.price}
                    className="flex-1 bg-emerald-500 text-black font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    {loading ? 'SALVANDO...' : 'SALVAR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav currentView="shop" setView={setView} user={user} />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed.id ? parsed : null;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [view, setView] = useState<'auth' | 'dashboard' | 'weekly' | 'run' | 'bodybuilding' | 'crossfit' | 'profile' | 'history' | 'recipes' | 'instructor' | 'ranking' | 'trainer' | 'gyms' | 'competitions' | 'invite' | 'shop' | 'trainer-sales'>('auth');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', password: '' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check URL for invite code
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
      const code = path.split('/')[2];
      if (code) {
        setInviteCode(code);
        if (user) {
          setView('invite');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboard();
      if (inviteCode) {
        setView('invite');
      } else {
        setView('dashboard');
      }
    }
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      setUser(e.detail);
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/dashboard/${user.id}`);
      const data = await res.json();
      setDashboardData(data);
    } catch (e) {
      console.error("Failed to fetch dashboard", e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else {
        setAuthError(data.error || "Erro na autenticação");
      }
    } catch (e) {
      setAuthError("Erro na conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setAuthForm({ name: '', phone: '', password: '' });
    setAuthError('');
    setLoading(false);
    setView('auth');
  };

  return (
    <div className="font-sans selection:bg-emerald-500 selection:text-black min-h-screen relative text-white">
      {/* Global Background Image */}
      {view !== 'auth' && (
        <div className="fixed inset-0 z-[-1]">
          <img 
            src="https://i.postimg.cc/DyggjbCr/Whats-App-Image-2026-03-06-at-19-37-27.jpg" 
            alt="App Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      <AnimatePresence mode="wait">
        {view === 'auth' && (
          <AuthView 
            key="auth" 
            authMode={authMode} 
            setAuthMode={setAuthMode} 
            authForm={authForm} 
            setAuthForm={setAuthForm} 
            handleAuth={handleAuth} 
            loading={loading} 
            authError={authError}
          />
        )}
        {view === 'dashboard' && (
          <DashboardView 
            key="dashboard" 
            user={user} 
            dashboardData={dashboardData} 
            setView={setView} 
          />
        )}
        {view === 'weekly' && (
          <WeeklyView 
            key="weekly" 
            dashboardData={dashboardData} 
            setView={setView} 
          />
        )}
        {view === 'invite' && (
          <InviteView 
            key="invite" 
            user={user} 
            setView={setView} 
            inviteCode={inviteCode} 
          />
        )}
        {view === 'run' && (
          <RunView 
            key="run" 
            user={user} 
            setView={setView} 
            fetchDashboard={fetchDashboard} 
          />
        )}
        {view === 'bodybuilding' && (
          <BodybuildingView 
            key="bodybuilding" 
            user={user} 
            setView={setView} 
            fetchDashboard={fetchDashboard} 
          />
        )}
        {view === 'crossfit' && (
          <CrossFitView 
            key="crossfit" 
            user={user} 
            setView={setView} 
            fetchDashboard={fetchDashboard} 
          />
        )}
        {view === 'instructor' && (
          <InstructorView 
            key="instructor" 
            user={user} 
            setView={setView} 
          />
        )}
        {view === 'profile' && (
          <ProfileView 
            key="profile" 
            user={user} 
            setUser={setUser} 
            setView={setView} 
            logout={logout} 
          />
        )}
        {view === 'recipes' && (
          <RecipesView 
            key="recipes" 
            setView={setView} 
          />
        )}
        {view === 'history' && (
          <HistoryView 
            key="history" 
            user={user} 
            setView={setView} 
          />
        )}
        {view === 'ranking' && (
          <RankingView 
            key="ranking" 
            dashboardData={dashboardData} 
            setView={setView} 
          />
        )}
        {view === 'trainer' && (
          <TrainerView 
            key="trainer" 
            user={user} 
            setView={setView} 
          />
        )}
        {view === 'gyms' && (
          <GymsView 
            key="gyms" 
            user={user} 
            setView={setView} 
          />
        )}
        {view === 'competitions' && (
          <CompetitionsView 
            key="competitions" 
            user={user} 
            setView={setView} 
          />
        )}
        {view === 'shop' && (
          <ShopView 
            key="shop" 
            user={user} 
            setView={setView} 
          />
        )}
        {view === 'trainer-sales' && (
          <TrainerSalesView 
            key="trainer-sales" 
            user={user} 
            setView={setView} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
