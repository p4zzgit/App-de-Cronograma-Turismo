import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'https://esm.sh/htm';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  ListTodo, 
  Megaphone, 
  FileText, 
  AlertCircle,
  MoreVertical,
  Trash2,
  ExternalLink,
  ArrowUpRight,
  Edit2,
  Settings,
  Image as ImageIcon,
  Type as TypeIcon,
  Palette,
  Upload,
  Save
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  isTomorrow,
  addDays,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

const html = htm.bind(React.createElement);

// --- Firebase Init ---
let db;
try {
  console.log("Initializing Firebase with config:", firebaseConfig);
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase/Firestore initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// --- Utility ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Initial Data ---
const DEFAULT_SETTINGS = {
  appTitle: 'Coordenação Mídia',
  logoUrl: '',
  tabLabels: {
    dashboard: 'Início',
    cronograma: 'Agenda',
    tarefas: 'Tarefas',
    campanhas: 'Campanhas',
    configuracoes: 'Ajustes'
  },
  primaryColor: '#2563eb',
  loginUser: 'admin',
  loginPassword: 'admin',
  settingsPassword: 'admin'
};

// --- Components ---

function LoginScreen({ settings, onLogin, onReset }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleLogin = (e) => {
    e.preventDefault();
    if (user.trim() === settings.loginUser && pass.trim() === settings.loginPassword) {
      onLogin();
    } else {
      setError('Usuário ou senha incorretos');
      setAttempts(prev => prev + 1);
    }
  };

  return html`
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <${motion.div} 
        initial=${{ opacity: 0, y: 20 }}
        animate=${{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10">
          ${settings.logoUrl ? html`
            <img src=${settings.logoUrl} alt="Logo" className="w-24 h-24 object-contain mb-6" referrerPolicy="no-referrer" />
          ` : html`
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 mb-6" style=${{ backgroundColor: settings.primaryColor }}>
              <${LayoutDashboard} size=${40} />
            </div>
          `}
          <h1 className="text-2xl font-black text-slate-800 text-center leading-tight">${settings.appTitle}</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Acesso Restrito</p>
        </div>

        <form onSubmit=${handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
            <input 
              type="text" 
              value=${user} 
              onChange=${(e) => setUser(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="password" 
              value=${pass} 
              onChange=${(e) => setPass(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          ${error && html`
            <div className="space-y-2 text-center">
              <p className="text-red-500 text-xs font-bold mt-2">${error}</p>
              ${attempts >= 2 && html`
                <button 
                  type="button"
                  onClick=${onReset}
                  className="text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:underline"
                >
                  Esqueceu a senha? Resetar para admin/admin
                </button>
              `}
            </div>
          `}

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-200 active:scale-[0.98] transition-all mt-4"
            style=${{ backgroundColor: settings.primaryColor }}
          >
            Entrar no Sistema
          </button>
        </form>
      </${motion.div}>
    </div>
  `;
}

function SettingsLockScreen({ settings, onUnlock, onCancel }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pass === settings.settingsPassword) {
      onUnlock();
    } else {
      setError('Senha incorreta');
    }
  };

  return html`
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <${motion.div} 
        initial=${{ opacity: 0, scale: 0.9 }}
        animate=${{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100"
      >
        <div className="p-4 bg-amber-50 rounded-full text-amber-600 mb-6 mx-auto w-fit">
          <${Settings} size=${32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm mb-8 font-medium">Digite a senha de administrador para acessar as configurações.</p>

        <form onSubmit=${handleUnlock} className="space-y-4">
          <input 
            type="password" 
            value=${pass} 
            onChange=${(e) => setPass(e.target.value)}
            placeholder="Senha de Ajustes"
            autoFocus
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          
          ${error && html`<p className="text-red-500 text-xs font-bold mb-2">${error}</p>`}

          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all"
            >
              Desbloquear
            </button>
            <button 
              type="button"
              onClick=${onCancel}
              className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold active:scale-[0.98] transition-all"
            >
              Voltar
            </button>
          </div>
        </form>
      </${motion.div}>
    </div>
  `;
}

export default function App() {
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (activeTab !== 'configuracoes') {
      setIsSettingsUnlocked(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!db) {
      console.error("Firestore database is not initialized. Check Firebase configuration.");
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const unsubActivities = onSnapshot(collection(db, 'activities'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivities(data);
      setIsLoading(false);
      clearTimeout(timeout);
    }, (error) => {
      console.error("Error fetching activities:", error);
      if (error.code === 'permission-denied') setHasPermissionError(true);
      setIsLoading(false);
      clearTimeout(timeout);
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      if (error.code === 'permission-denied') setHasPermissionError(true);
    });

    const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(data);
    }, (error) => {
      console.error("Error fetching campaigns:", error);
      if (error.code === 'permission-denied') setHasPermissionError(true);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings(prev => ({ ...prev, ...data }));
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
      if (error.code === 'permission-denied') setHasPermissionError(true);
    });

    return () => {
      if (unsubActivities) unsubActivities();
      if (unsubTasks) unsubTasks();
      if (unsubCampaigns) unsubCampaigns();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  const handleAddActivity = async (activity) => {
    if (!db) return;
    const { id, ...data } = activity;
    await setDoc(doc(db, 'activities', id), data);
  };

  const handleUpdateActivity = async (activity) => {
    if (!db) return;
    const { id, ...data } = activity;
    await updateDoc(doc(db, 'activities', id), data);
  };

  const handleDeleteActivity = async (id) => {
    if (!db) return;
    await deleteDoc(doc(db, 'activities', id));
  };

  const handleReorderActivities = async (newActivities) => {
    setActivities(newActivities);
  };

  const handleAddTask = async (task) => {
    if (!db) return;
    const { id, ...data } = task;
    await setDoc(doc(db, 'tasks', id), data);
  };

  const handleUpdateTask = async (task) => {
    if (!db) return;
    const { id, ...data } = task;
    await updateDoc(doc(db, 'tasks', id), data);
  };

  const handleDeleteTask = async (id) => {
    if (!db) return;
    await deleteDoc(doc(db, 'tasks', id));
  };

  const handleAddCampaign = async (campaign) => {
    if (!db) return;
    const { id, ...data } = campaign;
    await setDoc(doc(db, 'campaigns', id), data);
  };

  const handleUpdateCampaign = async (campaign) => {
    if (!db) return;
    const { id, ...data } = campaign;
    await updateDoc(doc(db, 'campaigns', id), data);
  };

  const handleDeleteCampaign = async (id) => {
    if (!db) return;
    await deleteDoc(doc(db, 'campaigns', id));
  };

  const handleUpdateSettings = async (newSettings) => {
    if (!db) return;
    await setDoc(doc(db, 'settings', 'app'), newSettings);
  };

  const todayActivities = activities.filter(a => isToday(parseISO(a.date)));
  const tomorrowActivities = activities.filter(a => isTomorrow(parseISO(a.date)));
  const lateTasks = tasks.filter(t => t.status !== 'concluida' && new Date(t.dueDate) < new Date() && !isToday(parseISO(t.dueDate)));

  const handleResetSettings = async () => {
    if (!db) return;
    if (confirm('Deseja resetar as credenciais para admin/admin?')) {
      const newSettings = { 
        ...settings, 
        loginUser: 'admin', 
        loginPassword: 'admin',
        settingsPassword: 'admin'
      };
      await setDoc(doc(db, 'settings', 'app'), newSettings);
      setSettings(newSettings);
      alert('Credenciais resetadas com sucesso!');
    }
  };

  const renderContent = () => {
    if (!isAuthenticated) return html`<${LoginScreen} settings=${settings} onLogin=${() => setIsAuthenticated(true)} onReset=${handleResetSettings} />`;

    if (!db) return html`
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="p-4 bg-red-50 rounded-full text-red-600 mb-6">
          <${AlertCircle} size=${48} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-4">Erro de Conexão</h2>
        <p className="text-slate-600 mb-4 max-w-md">
          Não foi possível conectar ao serviço Firestore. Isso geralmente acontece se o serviço não foi ativado no Console do Firebase.
        </p>
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs font-mono">
          <p className="font-bold text-slate-800 mb-2">Como resolver:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>Vá ao Console do Firebase</li>
            <li>Clique em <b>Firestore Database</b></li>
            <li>Clique em <b>Create Database</b></li>
            <li>Escolha o modo de teste ou produção</li>
          </ol>
        </div>
      </div>
    `;

    if (isLoading) return html`
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Carregando dados...</p>
        ${!firebaseConfig.apiKey || firebaseConfig.apiKey === 'SUA_API_KEY' ? html`
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
            <p className="font-bold mb-1">Configuração do Firebase ausente!</p>
            <p>Edite o arquivo <b>firebase-config.js</b> e adicione suas chaves do Firebase.</p>
          </div>
        ` : null}
      </div>
    `;

    if (hasPermissionError) return html`
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="p-4 bg-red-50 rounded-full text-red-600 mb-6">
          <${AlertCircle} size=${48} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-4">Acesso Negado</h2>
        <p className="text-slate-600 mb-8 max-w-md">
          O Firebase está bloqueando o acesso aos dados. Você precisa atualizar as <b>Regras de Segurança</b> no Console do Firebase.
        </p>
        <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl text-left font-mono text-xs w-full max-w-lg overflow-x-auto shadow-2xl">
          <p className="text-blue-400 mb-2">// Copie e cole no Firebase Rules:</p>
          <p>rules_version = '2';</p>
          <p>service cloud.firestore { '{' }</p>
          <p className="pl-4">match /databases/{ '{database}' }/documents { '{' }</p>
          <p className="pl-8 text-emerald-400">match /{ '{document=**}' } { '{' }</p>
          <p className="pl-12 text-emerald-400">allow read, write: if true;</p>
          <p className="pl-8 text-emerald-400">{ '}' }</p>
          <p className="pl-4">{ '}' }</p>
          <p>{ '}' }</p>
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Após publicar as regras, atualize esta página.
        </p>
      </div>
    `;

    switch (activeTab) {
      case 'dashboard': return html`<${DashboardView} 
        activities=${activities} 
        tasks=${tasks} 
        campaigns=${campaigns} 
        setActiveTab=${setActiveTab}
        todayActivities=${todayActivities}
        tomorrowActivities=${tomorrowActivities}
        lateTasks=${lateTasks}
      />`;
      case 'cronograma': return html`<${CronogramaView} 
        activities=${activities} 
        onAdd=${handleAddActivity}
        onUpdate=${handleUpdateActivity}
        onDelete=${handleDeleteActivity}
        onReorder=${handleReorderActivities}
        currentMonth=${currentMonth} 
        setCurrentMonth=${setCurrentMonth} 
      />`;
      case 'tarefas': return html`<${TarefasView} 
        tasks=${tasks} 
        onAdd=${handleAddTask}
        onUpdate=${handleUpdateTask}
        onDelete=${handleDeleteTask}
      />`;
      case 'campanhas': return html`<${CampanhasView} 
        campaigns=${campaigns} 
        onAdd=${handleAddCampaign}
        onUpdate=${handleUpdateCampaign}
        onDelete=${handleDeleteCampaign}
      />`;
      case 'configuracoes': 
        if (!isSettingsUnlocked) {
          return html`<${SettingsLockScreen} 
            settings=${settings} 
            onUnlock=${() => setIsSettingsUnlocked(true)} 
            onCancel=${() => setActiveTab('dashboard')}
          />`;
        }
        return html`<${ConfiguracoesView} 
          settings=${settings} 
          onUpdate=${handleUpdateSettings} 
        />`;
      default: return null;
    }
  };

  return html`
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            ${settings.logoUrl ? html`
              <img src=${settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg" referrerPolicy="no-referrer" />
            ` : html`
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200" style=${{ backgroundColor: settings.primaryColor }}>
                <${LayoutDashboard} size=${18} />
              </div>
            `}
            <h1 className="font-bold text-lg tracking-tight text-slate-800">${settings.appTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick=${() => setActiveTab('configuracoes')}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <${Settings} size=${20} />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-3 max-w-md mx-auto">
        <${AnimatePresence} mode="wait">
          ${(todayActivities.length > 0 || lateTasks.length > 0) && html`
            <${motion.div} 
              initial=${{ opacity: 0, y: -10 }}
              animate=${{ opacity: 1, y: 0 }}
              exit=${{ opacity: 0, y: -10 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                  <${Clock} size=${18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Resumo de Hoje</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    ${todayActivities.length} atividades programadas. 
                    ${lateTasks.length > 0 && ` ${lateTasks.length} tarefas atrasadas.`}
                  </p>
                </div>
              </div>
            </${motion.div}>
          `}
        </${AnimatePresence}>
      </div>

      <main className="max-w-md mx-auto px-4">
        ${renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 pb-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <${NavButton} active=${activeTab === 'dashboard'} onClick=${() => setActiveTab('dashboard')} icon=${html`<${LayoutDashboard} size=${20} />`} label=${settings.tabLabels.dashboard} />
          <${NavButton} active=${activeTab === 'cronograma'} onClick=${() => setActiveTab('cronograma')} icon=${html`<${Calendar} size=${20} />`} label=${settings.tabLabels.cronograma} />
          <${NavButton} active=${activeTab === 'tarefas'} onClick=${() => setActiveTab('tarefas')} icon=${html`<${ListTodo} size=${20} />`} label=${settings.tabLabels.tarefas} />
          <${NavButton} active=${activeTab === 'campanhas'} onClick=${() => setActiveTab('campanhas')} icon=${html`<${Megaphone} size=${20} />`} label=${settings.tabLabels.campanhas} />
          <${NavButton} active=${activeTab === 'configuracoes'} onClick=${() => setActiveTab('configuracoes')} icon=${html`<${Settings} size=${20} />`} label=${settings.tabLabels.configuracoes} />
        </div>
      </nav>
    </div>
  `;
}

function NavButton({ active, onClick, icon, label }) {
  return html`
    <button 
      onClick=${onClick}
      className=${cn(
        "flex flex-col items-center gap-1 transition-all duration-200 flex-1",
        active ? "text-blue-600 scale-110" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className=${cn(
        "p-1 rounded-lg transition-colors",
        active ? "bg-blue-50" : "bg-transparent"
      )}>
        ${icon}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">${label}</span>
    </button>
  `;
}

// --- Dashboard View ---
function DashboardView({ activities, tasks, campaigns, setActiveTab, todayActivities, tomorrowActivities, lateTasks }) {
  return html`
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <${StatCard} 
          label="Tarefas Pendentes" 
          value=${tasks.filter(t => t.status === 'pendente').length} 
          color="blue" 
          onClick=${() => setActiveTab('tarefas')}
        />
        <${StatCard} 
          label="Campanhas Ativas" 
          value=${campaigns.filter(c => c.status === 'em_andamento').length} 
          color="emerald" 
          onClick=${() => setActiveTab('campanhas')}
        />
      </div>

      <${SectionCard} 
        title="Cronograma" 
        icon=${html`<${Calendar} className="text-blue-600" size=${20} />`}
        onSeeAll=${() => setActiveTab('cronograma')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoje</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              ${format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          ${todayActivities.length > 0 ? todayActivities.map(a => html`
            <div key=${a.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-slate-800">${a.title}</p>
                <p className="text-xs text-slate-500 line-clamp-1">${a.description}</p>
              </div>
            </div>
          `) : html`<p className="text-xs text-slate-400 italic text-center py-2">Nenhuma atividade para hoje</p>`}

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amanhã</span>
          </div>
          ${tomorrowActivities.length > 0 ? tomorrowActivities.map(a => html`
            <div key=${a.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-75">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-slate-800">${a.title}</p>
                <p className="text-xs text-slate-500 line-clamp-1">${a.description}</p>
              </div>
            </div>
          `) : html`<p className="text-xs text-slate-400 italic text-center py-2">Nenhuma atividade para amanhã</p>`}
        </div>
      </${SectionCard}>

      <${SectionCard} 
        title="Tarefas Prioritárias" 
        icon=${html`<${ListTodo} className="text-amber-600" size=${20} />`}
        onSeeAll=${() => setActiveTab('tarefas')}
      >
        <div className="space-y-3">
          ${tasks.filter(t => t.status !== 'concluida').slice(0, 3).map(t => html`
            <div key=${t.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className=${cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  t.status === 'em_andamento' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                )}>
                  ${t.status === 'em_andamento' ? html`<${Clock} size=${16} />` : html`<${AlertCircle} size=${16} />`}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">${t.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium">${t.responsible}</p>
                </div>
              </div>
              <div className=${cn(
                "text-[10px] font-bold px-2 py-1 rounded-md uppercase",
                t.status === 'em_andamento' ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"
              )}>
                ${t.status.replace('_', ' ')}
              </div>
            </div>
          `)}
        </div>
      </${SectionCard}>

      <div className="grid grid-cols-1 gap-4">
        <${SectionCard} 
          title="Campanhas" 
          icon=${html`<${Megaphone} className="text-emerald-600" size=${18} />`}
          onSeeAll=${() => setActiveTab('campanhas')}
        >
          <p className="text-xs text-slate-500">${campaigns.length} cadastradas</p>
        </${SectionCard}>
        
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
          <${Plus} size=${24} className="mb-2 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">Espaço para futuras seções</p>
        </div>
      </div>
    </div>
  `;
}

function StatCard({ label, value, color, onClick }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return html`
    <button 
      onClick=${onClick}
      className=${cn("p-4 rounded-2xl border text-left transition-transform active:scale-95", colors[color])}
    >
      <p className="text-2xl font-black tracking-tight">${value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">${label}</p>
    </button>
  `;
}

function SectionCard({ title, icon, children, onSeeAll, compact }) {
  return html`
    <div className=${cn("bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm", compact ? "p-4" : "p-5")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          ${icon}
          <h3 className="font-bold text-slate-800 text-sm">${title}</h3>
        </div>
        <button 
          onClick=${onSeeAll}
          className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <${ArrowUpRight} size=${18} />
        </button>
      </div>
      ${children}
    </div>
  `;
}

// --- Cronograma View ---
function CronogramaView({ activities, onAdd, onUpdate, onDelete, onReorder, currentMonth, setCurrentMonth }) {
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', responsible: '' });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayActivities = activities.filter(a => isSameDay(parseISO(a.date), selectedDay));

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setFormData({ title: '', description: '', responsible: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({ title: activity.title, description: activity.description, responsible: activity.responsible });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title || !selectedDay) return;
    
    if (editingActivity) {
      onUpdate({ ...editingActivity, ...formData });
    } else {
      const activity = {
        id: Math.random().toString(36).substr(2, 9),
        date: selectedDay.toISOString(),
        ...formData
      };
      onAdd(activity);
    }
    
    setShowModal(false);
  };

  const moveActivity = (id, direction) => {
    const dayActivities = [...selectedDayActivities];
    const index = dayActivities.findIndex(a => a.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= dayActivities.length) return;
    
    const item = dayActivities.splice(index, 1)[0];
    dayActivities.splice(newIndex, 0, item);
    
    const otherActivities = activities.filter(a => !isSameDay(parseISO(a.date), selectedDay));
    onReorder([...otherActivities, ...dayActivities]);
  };

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick=${() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-full">
          <${ChevronLeft} size=${20} />
        </button>
        <h2 className="font-bold text-slate-800 capitalize">
          ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button onClick=${() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-full">
          <${ChevronRight} size=${20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        ${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => html`
          <div key=${`${d}-${i}`} className="text-center text-[10px] font-bold text-slate-400 py-2">${d}</div>
        `)}
        ${days.map(day => {
          const hasActivities = activities.some(a => isSameDay(parseISO(a.date), day));
          const isSel = selectedDay && isSameDay(day, selectedDay);
          const isTod = isToday(day);

          return html`
            <button
              key=${day.toString()}
              onClick=${() => setSelectedDay(day)}
              className=${cn(
                "aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all active:scale-90",
                isSel ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "hover:bg-slate-50",
                isTod && !isSel && "text-blue-600 font-black"
              )}
            >
              <span className="text-xs font-bold">${format(day, 'd')}</span>
              ${hasActivities && html`
                <div className=${cn(
                  "w-1 h-1 rounded-full mt-1",
                  isSel ? "bg-white" : "bg-blue-400"
                )}></div>
              `}
            </button>
          `;
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <${Calendar} size=${18} className="text-blue-600" />
            ${selectedDay ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
          </h3>
          <button 
            onClick=${handleOpenAdd}
            className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <${Plus} size=${20} />
          </button>
        </div>

        <div className="space-y-3">
          ${selectedDayActivities.length > 0 ? selectedDayActivities.map((a, index) => html`
            <${motion.div} 
              layout
              initial=${{ opacity: 0, x: -10 }}
              animate=${{ opacity: 1, x: 0 }}
              key=${a.id} 
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-800">${a.title}</p>
                  <button onClick=${() => handleOpenEdit(a)} className="text-slate-400 hover:text-blue-600">
                    <${Edit2} size=${14} />
                  </button>
                </div>
                <p className="text-xs text-slate-500">${a.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    ${a.responsible}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      disabled=${index === 0}
                      onClick=${() => moveActivity(a.id, 'up')}
                      className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30"
                    >
                      <${ChevronLeft} className="rotate-90" size=${16} />
                    </button>
                    <button 
                      disabled=${index === selectedDayActivities.length - 1}
                      onClick=${() => moveActivity(a.id, 'down')}
                      className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30"
                    >
                      <${ChevronLeft} className="rotate-[-90deg]" size=${16} />
                    </button>
                  </div>
                </div>
              </div>
              <button onClick=${() => onDelete(a.id)} className="text-slate-300 hover:text-red-500 p-1 ml-2">
                <${Trash2} size=${16} />
              </button>
            </${motion.div}>
          `) : html`
            <div className="text-center py-12 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-400">Nenhuma atividade programada</p>
            </div>
          `}
        </div>
      </div>

      <${AnimatePresence}>
        ${showModal && html`
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <${motion.div} 
              initial=${{ y: '100%' }}
              animate=${{ y: 0 }}
              exit=${{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800">
                  ${editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
                </h3>
                <button onClick=${() => setShowModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <${ChevronLeft} className="rotate-[-90deg]" size=${20} />
                </button>
              </div>
              <div className="space-y-4">
                <${Input} label="Título" value=${formData.title} onChange=${(e) => setFormData({...formData, title: e.target.value})} placeholder="Ex: Postagem Facebook" />
                <${Input} label="Descrição" value=${formData.description} onChange=${(e) => setFormData({...formData, description: e.target.value})} placeholder="Detalhes da atividade..." />
                <${Input} label="Responsável" value=${formData.responsible} onChange=${(e) => setFormData({...formData, responsible: e.target.value})} placeholder="Nome do responsável" />
                <button 
                  onClick=${handleSave}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-[0.98] transition-all mt-4"
                >
                  ${editingActivity ? 'Atualizar Atividade' : 'Salvar Atividade'}
                </button>
              </div>
            </${motion.div}>
          </div>
        `}
      </${AnimatePresence}>
    </div>
  `;
}

// --- Tarefas View ---
function TarefasView({ tasks, onAdd, onUpdate, onDelete }) {
  const [filter, setFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', responsible: '', status: 'pendente' });

  const filteredTasks = tasks.filter(t => filter === 'todos' || t.status === filter);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', responsible: '', status: 'pendente' });
    setShowModal(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description, responsible: task.responsible, status: task.status });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title) return;
    
    if (editingTask) {
      onUpdate({ ...editingTask, ...formData });
    } else {
      const task = {
        id: Math.random().toString(36).substr(2, 9),
        dueDate: new Date().toISOString(),
        ...formData
      };
      onAdd(task);
    }
    
    setShowModal(false);
  };

  const toggleStatus = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const nextStatusMap = {
      'pendente': 'em_andamento',
      'em_andamento': 'concluida',
      'concluida': 'pendente'
    };
    const nextStatus = nextStatusMap[task.status] || 'pendente';
    onUpdate({ ...task, status: nextStatus });
  };

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">Tarefas</h2>
        <button 
          onClick=${handleOpenAdd}
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          <${Plus} size=${24} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        ${['todos', 'pendente', 'em_andamento', 'concluida'].map(f => html`
          <button
            key=${f}
            onClick=${() => setFilter(f)}
            className=${cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
              filter === f ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"
            )}
          >
            ${f.replace('_', ' ').toUpperCase()}
          </button>
        `)}
      </div>

      <div className="space-y-3">
        ${filteredTasks.map(t => html`
          <${motion.div} 
            layout
            initial=${{ opacity: 0, scale: 0.95 }}
            animate=${{ opacity: 1, scale: 1 }}
            key=${t.id} 
            className=${cn(
              "bg-white p-4 rounded-3xl border shadow-sm transition-all",
              t.status === 'concluida' ? "opacity-60 border-slate-100" : "border-slate-200"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <button 
                onClick=${() => toggleStatus(t.id)}
                className=${cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 transition-colors",
                  t.status === 'concluida' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                )}
              >
                ${t.status === 'concluida' && html`<${CheckCircle2} size=${14} />`}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className=${cn("font-bold text-slate-800", t.status === 'concluida' && "line-through")}>${t.title}</h4>
                  <button onClick=${() => handleOpenEdit(t)} className="text-slate-400 hover:text-blue-600">
                    <${Edit2} size=${14} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">${t.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                      ${t.responsible.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${t.responsible}</span>
                  </div>
                  <button onClick=${() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-red-500">
                    <${Trash2} size=${16} />
                  </button>
                </div>
              </div>
            </div>
          </${motion.div}>
        `)}
      </div>

      <${AnimatePresence}>
        ${showModal && html`
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <${motion.div} 
              initial=${{ y: '100%' }}
              animate=${{ y: 0 }}
              exit=${{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800">
                  ${editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h3>
                <button onClick=${() => setShowModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <${ChevronLeft} className="rotate-[-90deg]" size=${20} />
                </button>
              </div>
              <div className="space-y-4">
                <${Input} label="Título" value=${formData.title} onChange=${(e) => setFormData({...formData, title: e.target.value})} placeholder="O que precisa ser feito?" />
                <${Input} label="Descrição" value=${formData.description} onChange=${(e) => setFormData({...formData, description: e.target.value})} placeholder="Mais detalhes..." />
                <${Input} label="Responsável" value=${formData.responsible} onChange=${(e) => setFormData({...formData, responsible: e.target.value})} placeholder="Quem vai fazer?" />
                
                ${editingTask && html`
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      value=${formData.status} 
                      onChange=${(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluida">Concluída</option>
                    </select>
                  </div>
                `}

                <button 
                  onClick=${handleSave}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-[0.98] transition-all mt-4"
                >
                  ${editingTask ? 'Atualizar Tarefa' : 'Criar Tarefa'}
                </button>
              </div>
            </${motion.div}>
          </div>
        `}
      </${AnimatePresence}>
    </div>
  `;
}

// --- Campanhas View ---
function CampanhasView({ campaigns, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', startDate: '', endDate: '', responsible: '', status: 'planejada' });

  const handleOpenAdd = () => {
    setEditingCampaign(null);
    setFormData({ title: '', description: '', startDate: '', endDate: '', responsible: '', status: 'planejada' });
    setShowModal(true);
  };

  const handleOpenEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({ 
      title: campaign.title, 
      description: campaign.description, 
      startDate: campaign.startDate, 
      endDate: campaign.endDate, 
      responsible: campaign.responsible, 
      status: campaign.status 
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title) return;
    
    if (editingCampaign) {
      onUpdate({ ...editingCampaign, ...formData });
    } else {
      const campaign = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      };
      onAdd(campaign);
    }
    
    setShowModal(false);
  };

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">Campanhas</h2>
        <button 
          onClick=${handleOpenAdd}
          className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
        >
          <${Plus} size=${24} />
        </button>
      </div>

      <div className="space-y-4">
        ${campaigns.map(c => html`
          <div key=${c.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className=${cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                c.status === 'em_andamento' ? "bg-emerald-100 text-emerald-700" : 
                c.status === 'concluida' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              )}>
                ${c.status.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-1">
                <button onClick=${() => handleOpenEdit(c)} className="p-2 text-slate-400 hover:text-blue-600">
                  <${Edit2} size=${18} />
                </button>
                <button onClick=${() => onDelete(c.id)} className="p-2 text-slate-300 hover:text-red-500">
                  <${Trash2} size=${18} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-800">${c.title}</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">${c.description}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período</span>
                <span className="text-xs font-bold text-slate-700">${c.startDate} até ${c.endDate}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</span>
                <span className="text-xs font-bold text-slate-700">${c.responsible}</span>
              </div>
            </div>
          </div>
        `)}
      </div>

      <${AnimatePresence}>
        ${showModal && html`
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <${motion.div} 
              initial=${{ y: '100%' }}
              animate=${{ y: 0 }}
              exit=${{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800">
                  ${editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
                </h3>
                <button onClick=${() => setShowModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <${ChevronLeft} className="rotate-[-90deg]" size=${20} />
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-4">
                <${Input} label="Título" value=${formData.title} onChange=${(e) => setFormData({...formData, title: e.target.value})} placeholder="Nome da campanha" />
                <${Input} label="Descrição" value=${formData.description} onChange=${(e) => setFormData({...formData, description: e.target.value})} placeholder="Objetivos..." />
                <div className="grid grid-cols-2 gap-3">
                  <${Input} label="Início" type="date" value=${formData.startDate} onChange=${(e) => setFormData({...formData, startDate: e.target.value})} />
                  <${Input} label="Fim" type="date" value=${formData.endDate} onChange=${(e) => setFormData({...formData, endDate: e.target.value})} />
                </div>
                <${Input} label="Responsável" value=${formData.responsible} onChange=${(e) => setFormData({...formData, responsible: e.target.value})} placeholder="Secretaria/Setor" />
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value=${formData.status} 
                    onChange=${(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="planejada">Planejada</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>

                <button 
                  onClick=${handleSave}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-200 active:scale-[0.98] transition-all mt-4"
                >
                  ${editingCampaign ? 'Atualizar Campanha' : 'Criar Campanha'}
                </button>
              </div>
            </${motion.div}>
          </div>
        `}
      </${AnimatePresence}>
    </div>
  `;
}

// --- Configuracoes View ---
function ConfiguracoesView({ settings, onUpdate }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    console.log("Local settings updated:", localSettings);
  }, [localSettings]);

  const updateSetting = (key, value) => {
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const updateTabLabel = (tab, label) => {
    setLocalSettings({
      ...localSettings,
      tabLabels: {
        ...localSettings.tabLabels,
        [tab]: label
      }
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSetting('logoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    console.log("Saving settings...", localSettings);
    setIsSaving(true);
    try {
      await onUpdate(localSettings);
      console.log("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(`Erro ao salvar configurações: ${error.message || error}. Verifique as permissões do Firebase.`);
    }
    setIsSaving(false);
  };

  return html`
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">Configurações</h2>
        <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
          <${Settings} size=${24} />
        </div>
      </div>

      <div className="space-y-4">
        <${SectionCard} title="Identidade" icon=${html`<${ImageIcon} className="text-blue-600" size=${18} />`}>
          <div className="space-y-4">
            <${Input} 
              label="Título do Topo" 
              value=${localSettings.appTitle} 
              onChange=${(e) => updateSetting('appTitle', e.target.value)} 
              placeholder="Ex: Coordenação de Mídia"
            />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo da Secretaria</label>
              <div className="flex flex-col gap-3">
                ${localSettings.logoUrl && html`
                  <div className="relative w-20 h-20 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden group">
                    <img src=${localSettings.logoUrl} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    <button 
                      onClick=${() => updateSetting('logoUrl', '')}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <${Trash2} size=${16} />
                    </button>
                  </div>
                `}
                <label className="flex items-center justify-center gap-2 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <${Upload} size=${18} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">Upload Logo</span>
                  <input type="file" accept="image/*" onChange=${handleLogoUpload} className="hidden" />
                </label>
                <${Input} 
                  label="Ou URL da Logo" 
                  value=${localSettings.logoUrl} 
                  onChange=${(e) => updateSetting('logoUrl', e.target.value)} 
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Principal</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value=${localSettings.primaryColor} 
                  onChange=${(e) => updateSetting('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-500 uppercase">${localSettings.primaryColor}</span>
              </div>
            </div>
          </div>
        </${SectionCard}>

        <${SectionCard} title="Nomes das Abas" icon=${html`<${TypeIcon} className="text-amber-600" size=${18} />`}>
          <div className="grid grid-cols-1 gap-4">
            <${Input} label="Aba Início" value=${localSettings.tabLabels.dashboard} onChange=${(e) => updateTabLabel('dashboard', e.target.value)} />
            <${Input} label="Aba Agenda" value=${localSettings.tabLabels.cronograma} onChange=${(e) => updateTabLabel('cronograma', e.target.value)} />
            <${Input} label="Aba Tarefas" value=${localSettings.tabLabels.tarefas} onChange=${(e) => updateTabLabel('tarefas', e.target.value)} />
            <${Input} label="Aba Campanhas" value=${localSettings.tabLabels.campanhas} onChange=${(e) => updateTabLabel('campanhas', e.target.value)} />
            <${Input} label="Aba Ajustes" value=${localSettings.tabLabels.configuracoes} onChange=${(e) => updateTabLabel('configuracoes', e.target.value)} />
          </div>
        </${SectionCard}>

        <${SectionCard} title="Segurança e Acesso" icon=${html`<${AlertCircle} className="text-red-600" size=${18} />`}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <${Input} 
                label="Usuário de Login" 
                value=${localSettings.loginUser} 
                onChange=${(e) => updateSetting('loginUser', e.target.value)} 
                placeholder="admin"
              />
              <${Input} 
                label="Senha de Login" 
                type="text"
                value=${localSettings.loginPassword} 
                onChange=${(e) => updateSetting('loginPassword', e.target.value)} 
                placeholder="admin"
              />
            </div>
            <${Input} 
              label="Senha de Ajustes (Aba Configurações)" 
              type="text"
              value=${localSettings.settingsPassword} 
              onChange=${(e) => updateSetting('settingsPassword', e.target.value)} 
              placeholder="admin"
            />
            <p className="text-[10px] text-slate-400 italic px-1">
              * Estas senhas são usadas para proteger o acesso ao sistema e às configurações.
            </p>
          </div>
        </${SectionCard}>

        <button 
          onClick=${handleSave}
          disabled=${isSaving}
          className=${cn(
            "w-full py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2",
            isSaving ? "bg-slate-200 text-slate-400" : "bg-blue-600 text-white shadow-blue-200 active:scale-[0.98]"
          )}
        >
          ${isSaving ? html`<div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>` : html`
            <${Save} size=${20} />
            Salvar Alterações
          `}
        </button>

        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <${AlertCircle} size=${18} />
            </div>
            <h4 className="font-bold text-blue-900 text-sm">Uso Interno</h4>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            Este painel foi desenvolvido para coordenação rápida via celular. Todas as alterações são salvas localmente no seu dispositivo.
          </p>
        </div>
      </div>
    </div>
  `;
}

function Input({ label, ...props }) {
  return html`
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">${label}</label>
      <input 
        ...${props}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
    </div>
  `;
}

// --- Render ---
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
