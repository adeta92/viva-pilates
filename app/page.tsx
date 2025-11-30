"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, DollarSign, UserCog, LogOut, 
  Plus, Trash2, Check, X, ChevronLeft, ChevronRight, 
  Search, AlertCircle, Menu, Wallet, HeartPulse, CreditCard, RefreshCcw, Phone, Mail, Box, Pencil, ExternalLink, CalendarCheck, TrendingUp, Calculator, Upload, FileText, RotateCcw, Sparkles, Loader2 
} from 'lucide-react';

// ==========================================
// 1. TİP TANIMLAMALARI VE SABİTLER
// ==========================================

const apiKey = ""; 

// LOGO AYARI (public klasöründeki logo.jpeg dosyasını çeker)
const LOGO_URL = "/logo.jpeg"; 

// GİDER KATEGORİLERİ
const EXPENSE_CATEGORIES = ['Kira', 'Reklam', 'Barikat', 'Genel Stüdyo', 'Faturalar', 'Diğer'];

type UserRole = 'ADMIN' | 'STAFF';

interface User {
  username: string;
  role: UserRole;
  name: string;
}

interface PilatesPackage {
  id: string;
  name: string;
  type: 'SINGLE' | 'GROUP' | 'PRIVATE' | 'PRIVATE_GROUP';
  sessionCount: number;
  price: number;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  healthNotes: string;
  packageId: string; 
  packageName: string;
  remainingSessions: number;
  totalSessionsPaid: number;
  pricePaid: number;
  debt: number; 
  groupId?: string;
  groupName?: string;
  createdAt: string;
}

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  rate: number;
  startDate: string;
}

interface Lesson {
  id: string;
  title: string;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'mat' | 'reformer' | 'pregnant' | 'group' | 'private_group';
  groupName?: string;
  groupId?: string;
  memberIds: string[];
  isCompleted: boolean;
  googleCalendarEventId?: string;
  aiPlan?: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'LESSON_REVENUE' | 'TRAINER_PAYMENT' | 'MEMBER_PAYMENT' | 'OTHER' | string;
  description: string;
  amount: number;
  relatedId?: string;
  isPaid: boolean;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 08:00 - 23:00
const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const COMPANY_CALENDAR_EMAIL = "info@vivadapilates.com";
const FIXED_LOCATION = "https://www.google.com/maps/place//data=!4m2!3m1!1s0x14d34f80b870f781:0xa2c1dd28171858aa?sa=X&ved=1t:8290&ictx=111";

const DEFAULT_PACKAGES: PilatesPackage[] = [
  { id: 'p1', name: 'Tek Ders | 6\'lı', type: 'SINGLE', sessionCount: 6, price: 6000 },
  { id: 'p2', name: 'Tek Ders | 12\'li', type: 'SINGLE', sessionCount: 12, price: 10000 },
  { id: 'p3', name: 'Grup Ders | 6\'lı', type: 'GROUP', sessionCount: 6, price: 4000 },
  { id: 'p4', name: 'Grup Ders | 12\'li', type: 'GROUP', sessionCount: 12, price: 7000 },
  { id: 'p5', name: 'Özel Ders', type: 'PRIVATE', sessionCount: 1, price: 1500 },
  { id: 'p6', name: 'Duo (2 Kişilik) Özel', type: 'PRIVATE_GROUP', sessionCount: 1, price: 2500 },
];

const MOCK_ADMINS = ['deniztaskiran', 'cansaberi', 'cagkanhoca', 'erenhoca'];
const PASSWORDS: Record<string, string> = {
  'deniztaskiran': '5377846156',
  'cansaberi': '5434858325',
  'cagkanhoca': '5317337543',
  'erenhoca': '5532880041',
  'resepsiyon': 'vivada'
};

// ==========================================
// 2. YARDIMCI FONKSİYONLAR
// ==========================================

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const GoogleCalendarService = {
  createEvent: async (lesson: Partial<Lesson>, members: Member[], trainer: Trainer | undefined) => {
    return new Promise<{ eventId: string, status: string }>((resolve) => {
      setTimeout(() => { resolve({ eventId: `gcal_${generateId()}`, status: 'confirmed' }); }, 500); 
    });
  }
};

const openGoogleCalendar = (lesson: Partial<Lesson>, members: Member[], trainer: Trainer | undefined) => {
  const startStr = (lesson.date + 'T' + lesson.startTime + ':00').replace(/[-:]/g, '');
  const endStr = (lesson.date + 'T' + lesson.endTime + ':00').replace(/[-:]/g, '');

  const memberNames = members.map(m => `${m.firstName} ${m.lastName}`).join(', ');
  const emails = [
    COMPANY_CALENDAR_EMAIL,
    trainer?.email,
    ...members.map(m => m.email).filter(Boolean)
  ].join(',');

  const details = `Eğitmen: ${trainer?.firstName} ${trainer?.lastName}\nÖğrenciler: ${memberNames}\nDers Tipi: ${lesson.type}`;
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', lesson.title || 'Pilates Dersi');
  url.searchParams.append('dates', `${startStr}/${endStr}`);
  url.searchParams.append('details', details);
  url.searchParams.append('location', FIXED_LOCATION);
  url.searchParams.append('add', emails);

  window.open(url.toString(), '_blank');
};

// ==========================================
// 3. UI BİLEŞENLERİ (Building Blocks)
// ==========================================

function GlassCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ${className}`}>{children}</div>;
}

function PillInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/30 focus:outline-none focus:border-rose-400/50 focus:bg-black/30 transition-all duration-300 disabled:opacity-50 ${props.className}`} />;
}

function PillSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white appearance-none focus:outline-none focus:border-rose-400/50 transition-all duration-300 ${props.className}`}>{props.children}</select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">▼</div>
    </div>
  );
}

function PrimaryButton({ children, onClick, className = "", type = "button", disabled = false }: any) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-rose-900/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>{children}</button>
  );
}

function IconButton({ children, onClick, className = "", title = "" }: any) {
  return (
    <button onClick={onClick} title={title} className={`p-3 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 ${className}`}>{children}</button>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${active ? 'text-white bg-white/10 shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
      <span className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110 text-rose-400' : 'group-hover:text-rose-300'}`}>{icon}</span>
      <span className="font-medium relative z-10 text-sm tracking-wide">{label}</span>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-rose-500 rounded-r-full" />}
    </button>
  );
}

function StatCard({ icon, label, value, sub, color }: any) {
  const colorClasses: any = {
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };
  return (
    <GlassCard className="p-6 flex items-center gap-5 relative overflow-hidden group">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${colorClasses[color]} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>{icon}</div>
      <div><p className="text-white/40 text-sm font-medium uppercase tracking-wider">{label}</p><h3 className="text-2xl font-light text-white mt-1">{value}</h3><p className="text-white/20 text-xs mt-1">{sub}</p></div>
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClasses[color].split(' ')[0]}`} />
    </GlassCard>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 opacity-50">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-2xl">🍃</div>
      <p className="text-sm font-light">{message}</p>
    </div>
  );
}

// ==========================================
// 4. ALT SAYFALAR (VIEW COMPONENTS)
// ==========================================

// --- MEMBERS VIEW (EKSİK OLAN PARÇA EKLENDİ) ---
function MembersView({ members, setMembers, packages, setTransactions }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPackage = packages.find((p: PilatesPackage) => p.id === formData.packageId);
    
    const newMember: Member = {
      id: generateId(),
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      phone: formData.phone || "",
      email: formData.email || "",
      birthDate: formData.birthDate || "",
      healthNotes: formData.healthNotes || "",
      packageId: formData.packageId || "",
      packageName: selectedPackage?.name || "Paketsiz",
      remainingSessions: selectedPackage?.sessionCount || 0,
      totalSessionsPaid: selectedPackage?.sessionCount || 0,
      pricePaid: selectedPackage?.price || 0,
      debt: 0,
      createdAt: new Date().toISOString()
    };

    setMembers([...members, newMember]);
    
    // Gelir olarak ekle
    if (selectedPackage && selectedPackage.price > 0) {
      setTransactions((prev: Transaction[]) => [...prev, {
        id: generateId(),
        date: new Date().toISOString(),
        type: 'INCOME',
        category: 'MEMBER_PAYMENT',
        description: `Üyelik: ${newMember.firstName} ${newMember.lastName} (${selectedPackage.name})`,
        amount: selectedPackage.price,
        isPaid: true
      }]);
    }

    setShowAddModal(false);
    setFormData({});
  };

  const filteredMembers = members.filter((m: Member) => 
    (m.firstName + ' ' + m.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-light text-white">Üye Listesi</h1>
        <PrimaryButton onClick={() => setShowAddModal(true)} className="px-6 flex items-center gap-2">
          <Plus size={18} /> Yeni Üye Ekle
        </PrimaryButton>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="İsim veya telefon ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3 text-white focus:outline-none focus:border-rose-500/50"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest">
            <tr>
              <th className="p-4">Ad Soyad</th>
              <th className="p-4">Paket / Durum</th>
              <th className="p-4">Kalan Ders</th>
              <th className="p-4">Telefon</th>
              <th className="p-4 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredMembers.map((member: Member) => (
              <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="font-medium text-white">{member.firstName} {member.lastName}</div>
                  <div className="text-xs text-white/40">{member.healthNotes ? '⚠️ ' + member.healthNotes : 'Sağlık notu yok'}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-white/80">{member.packageName}</div>
                </td>
                <td className="p-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${member.remainingSessions <= 2 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                     {member.remainingSessions}
                   </span>
                </td>
                <td className="p-4 text-white/60 text-sm">{member.phone}</td>
                <td className="p-4 text-center">
                  <button onClick={() => { if(confirm('Silmek istediğinize emin misiniz?')) setMembers(members.filter((m:Member) => m.id !== member.id)) }} className="text-rose-400 hover:text-rose-300 p-2">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && <div className="p-8 text-center text-white/30">Üye bulunamadı.</div>}
      </GlassCard>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-lg bg-[#1c1c1e] border-white/10">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-light text-white">Yeni Üye Kaydı</h3>
              <button onClick={() => setShowAddModal(false)}><X className="text-white/50 hover:text-white" /></button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 ml-3">Ad *</label>
                  <PillInput required value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 ml-3">Soyad *</label>
                  <PillInput required value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 ml-3">Telefon</label>
                  <PillInput value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 ml-3">Doğum Tarihi</label>
                  <PillInput type="date" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-xs text-white/50 ml-3">Paket Seçimi *</label>
                 <PillSelect required value={formData.packageId || ''} onChange={e => setFormData({...formData, packageId: e.target.value})}>
                   <option value="">Paket Seçiniz...</option>
                   {packages.map((p: PilatesPackage) => (
                     <option key={p.id} value={p.id}>{p.name} ({p.sessionCount} Ders - {p.price} TL)</option>
                   ))}
                 </PillSelect>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/50 ml-3">Sağlık Notları</label>
                <textarea 
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/30 focus:outline-none focus:border-rose-400/50" 
                  rows={3}
                  value={formData.healthNotes || ''} 
                  onChange={e => setFormData({...formData, healthNotes: e.target.value})}
                />
              </div>
              <PrimaryButton className="w-full mt-4">Kaydet</PrimaryButton>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// --- PACKAGES VIEW ---
function PackagesView({ packages, setPackages }: { packages: PilatesPackage[], setPackages: any }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<PilatesPackage>>({});
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (formData.id) { setPackages(packages.map(p => p.id === formData.id ? { ...p, ...formData } : p)); } else { setPackages([...packages, { ...formData, id: generateId() }]); } setShowModal(false); setFormData({}); };
  const handleDelete = (id: string) => { if (confirm('Bu paketi silmek istediğinize emin misiniz?')) { setPackages(packages.filter(p => p.id !== id)); } };
  const openEditModal = (pkg: PilatesPackage) => { setFormData(pkg); setShowModal(true); };
  const openAddModal = () => { setFormData({ type: 'SINGLE', sessionCount: 1, price: 0 }); setShowModal(true); };
  const getTypeLabel = (type: string) => { switch(type) { case 'GROUP': return 'GRUP DERSİ'; case 'PRIVATE': return 'ÖZEL DERS'; case 'PRIVATE_GROUP': return 'ÖZEL GRUP DERSİ'; default: return 'BİREYSEL'; } };
  const getTypeColor = (type: string) => { switch(type) { case 'GROUP': return 'bg-purple-500/10 text-purple-300 border-purple-500/20'; case 'PRIVATE': return 'bg-amber-500/10 text-amber-300 border-amber-500/20'; case 'PRIVATE_GROUP': return 'bg-orange-500/10 text-orange-300 border-orange-500/20'; default: return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'; } };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-light text-white">Paket Yönetimi</h1><PrimaryButton onClick={openAddModal} className="px-6 flex items-center gap-2"><Plus size={18} /> Yeni Paket Ekle</PrimaryButton></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <GlassCard key={pkg.id} className="p-6 relative group hover:bg-white/[0.05] transition-colors flex flex-col h-full">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditModal(pkg)} className="p-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white rounded-full transition-colors" title="Düzenle"><Pencil size={14} /></button><button onClick={() => handleDelete(pkg.id)} className="p-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-full transition-colors" title="Sil"><Trash2 size={14} /></button></div>
            <div className="flex justify-between items-start mb-4"><div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400"><Box size={24} /></div><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${getTypeColor(pkg.type)}`}>{getTypeLabel(pkg.type)}</span></div>
            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
            <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm"><span className="text-white/40">Ders Hakkı</span><span className="text-white font-medium">{pkg.sessionCount} Ders</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-white/40">Paket Fiyatı</span><span className="text-2xl font-light text-rose-400">{pkg.price.toLocaleString('tr-TR')} ₺</span></div>
              <div className="flex justify-between items-center text-xs text-white/30"><span>Birim Ders Maliyeti</span><span>{pkg.sessionCount > 0 ? (pkg.price / pkg.sessionCount).toFixed(0) : 0} ₺/ders</span></div>
            </div>
          </GlassCard>
        ))}
      </div>
      {showModal && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><GlassCard className="w-full max-w-md bg-[#1c1c1e] border-white/10"><div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">{formData.id ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</h3><button onClick={() => setShowModal(false)}><X className="text-white/50 hover:text-white" /></button></div><form onSubmit={handleSubmit} className="p-6 space-y-6"><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Paket İsmi</label><PillInput required placeholder="Örn: 6'lı Reformer Paketi" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Paket Türü</label><PillSelect required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="SINGLE">Bireysel (Tek Kişilik)</option><option value="GROUP">Grup (Çok Kişilik)</option><option value="PRIVATE">Özel Ders (VIP)</option><option value="PRIVATE_GROUP">Özel Grup (Değişken)</option></PillSelect></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Ders Adedi</label><PillInput required type="number" min="1" placeholder="6" value={formData.sessionCount || ''} onChange={e => setFormData({...formData, sessionCount: parseInt(e.target.value)})} /></div><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Fiyat (₺)</label><PillInput required type="number" min="0" placeholder="5000" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} /></div></div><div className="bg-white/5 p-4 rounded-2xl text-xs text-white/60"><p>💡 <strong>İpucu:</strong> "Özel Grup" seçeneği, kişi sayısı ve fiyatın standart dışı olduğu durumlar (örn: Duo dersler) içindir.</p></div><PrimaryButton className="w-full mt-2">{formData.id ? 'Değişiklikleri Kaydet' : 'Paketi Oluştur'}</PrimaryButton></form></GlassCard></div>}
    </div>
  );
}

// --- ACCOUNTING VIEW ---
function AccountingView({ transactions, setTransactions }: any) {
  const [formType, setFormType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [category, setCategory] = useState(''); 
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const handleAddTransaction = (e: React.FormEvent) => { 
    e.preventDefault(); 
    const isPaid = formType === 'INCOME'; 
    
    let finalDesc = desc;
    if (formType === 'EXPENSE' && category !== 'Diğer') {
      finalDesc = category; 
    }

    setTransactions([...transactions, { 
      id: generateId(), 
      date: new Date().toISOString(), 
      type: formType, 
      category: category, 
      description: finalDesc, 
      amount: parseFloat(amt), 
      isPaid: isPaid 
    }]); 
    
    setDesc(''); 
    setAmt(''); 
    setCategory('');
  };

  const togglePaid = (id: string) => { setTransactions(transactions.map((t: Transaction) => t.id === id ? { ...t, isPaid: !t.isPaid } : t)); };
  const toggleSelect = (id: string) => { if (selectedTxIds.includes(id)) { setSelectedTxIds(selectedTxIds.filter(txId => txId !== id)); } else { setSelectedTxIds([...selectedTxIds, id]); } };
  const handleBulkPayment = () => { setTransactions(transactions.map((t: Transaction) => selectedTxIds.includes(t.id) ? { ...t, isPaid: true } : t)); setSelectedTxIds([]); setShowPaymentConfirm(false); };

  const totalIncome = transactions.filter((t: Transaction) => t.type === 'INCOME' && t.isPaid).reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
  const totalPaidExpense = transactions.filter((t: Transaction) => t.type === 'EXPENSE' && t.isPaid).reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
  const pendingExpenses = transactions.filter((t: Transaction) => t.type === 'EXPENSE' && !t.isPaid).reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalPaidExpense;
  const selectedTotal = transactions.filter((t: Transaction) => selectedTxIds.includes(t.id)).reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
  const projectedBalance = netBalance - selectedTotal;

  const breakdown = useMemo(() => {
    const selected = transactions.filter((t: Transaction) => selectedTxIds.includes(t.id));
    const groups: Record<string, number> = {};
    selected.forEach((t: any) => {
        let key = t.description;
        if (t.category === 'TRAINER_PAYMENT') {
            const match = t.description.match(/Hakediş: (.*?) \(/);
            if (match && match[1]) key = `${match[1]} Ödemesi`;
        }
        groups[key] = (groups[key] || 0) + t.amount;
    });
    return groups;
  }, [selectedTxIds, transactions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="px-6 py-6 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-4"><div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400"><Wallet size={24} /></div><div><p className="text-emerald-400/60 text-xs font-bold uppercase tracking-widest">Net Kasa (Nakit)</p><p className={`text-3xl font-light mt-1 text-emerald-400`}>{netBalance.toLocaleString('tr-TR')} ₺</p></div></GlassCard>
        <GlassCard className="px-6 py-6 bg-blue-500/10 border-blue-500/20 flex items-center gap-4"><div className="p-3 bg-blue-500/20 rounded-full text-blue-400"><TrendingUp size={24} /></div><div><p className="text-blue-400/60 text-xs font-bold uppercase tracking-widest">Toplam Gelir</p><p className="text-3xl font-light mt-1 text-white">{totalIncome.toLocaleString('tr-TR')} ₺</p></div></GlassCard>
        <GlassCard className="px-6 py-6 bg-rose-500/10 border-rose-500/20 flex items-center gap-4"><div className="p-3 bg-rose-500/20 rounded-full text-rose-400"><AlertCircle size={24} /></div><div><p className="text-rose-400/60 text-xs font-bold uppercase tracking-widest">Bekleyen Ödemeler</p><p className="text-3xl font-light mt-1 text-rose-400">{pendingExpenses.toLocaleString('tr-TR')} ₺</p></div></GlassCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
            <GlassCard className="p-6 bg-[#1c1c1e] border-white/10"><div className="flex gap-2 mb-6 p-1 bg-black/30 rounded-xl"><button onClick={() => setFormType('EXPENSE')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formType === 'EXPENSE' ? 'bg-rose-500 text-white' : 'text-white/40 hover:text-white'}`}>GİDER</button><button onClick={() => setFormType('INCOME')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formType === 'INCOME' ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}>GELİR</button></div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
                {formType === 'EXPENSE' ? (
                   <>
                    <PillSelect required value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">Gider Türü Seçiniz...</option>
                        {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </PillSelect>
                    {category === 'Diğer' && (
                        <textarea className="w-full bg-black/20 border border-white/10 rounded-3xl px-6 py-4 text-white placeholder-white/30 focus:outline-none min-h-[100px]" placeholder="Gider açıklaması..." maxLength={180} required value={desc} onChange={e => setDesc(e.target.value)} />
                    )}
                   </>
                ) : (
                     <textarea className="w-full bg-black/20 border border-white/10 rounded-3xl px-6 py-4 text-white placeholder-white/30 focus:outline-none min-h-[100px]" placeholder="Gelir açıklaması..." maxLength={180} required value={desc} onChange={e => setDesc(e.target.value)} />
                )}

                <PillInput type="number" placeholder="Tutar (₺)" required value={amt} onChange={e => setAmt(e.target.value)} />
                <button className={`w-full py-3 rounded-full transition-all font-medium ${formType === 'INCOME' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}>Kaydet</button>
                <p className="text-[10px] text-white/30 text-center">{formType === 'INCOME' ? '* Gelirler anında kasaya işlenir.' : '* Giderler "Ödenmemiş" olarak eklenir.'}</p>
            </form>
            </GlassCard>
            <GlassCard className="p-6 bg-indigo-900/20 border-indigo-500/20 relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><Calculator size={100} className="text-indigo-500"/></div><h3 className="font-medium text-white mb-4 flex items-center gap-2 relative z-10"><Calculator size={18}/> Ödeme Planlayıcı</h3>
            <div className="space-y-3 relative z-10 mb-4">{Object.keys(breakdown).length > 0 ? (<div className="bg-black/20 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">{Object.entries(breakdown).map(([key, value]) => (<div key={key} className="flex justify-between text-xs"><span className="text-white/70">{key}</span><span className="text-white font-mono">{value.toLocaleString('tr-TR')} ₺</span></div>))}</div>) : (<p className="text-xs text-white/30 text-center py-2">Ödeme seçimi yapın...</p>)}</div>
            <div className="space-y-3 relative z-10"><div className="flex justify-between text-sm text-white/60"><span>Seçili Toplam:</span><span className="text-white">{selectedTotal.toLocaleString('tr-TR')} ₺</span></div><div className="flex justify-between text-sm text-white/60"><span>Mevcut Kasa:</span><span className="text-emerald-400">{netBalance.toLocaleString('tr-TR')} ₺</span></div><div className="w-full h-px bg-white/10 my-2"></div><div className="flex justify-between text-sm font-bold text-white"><span>İşlem Sonrası:</span><span className={`${projectedBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{projectedBalance.toLocaleString('tr-TR')} ₺</span></div></div><button onClick={() => setShowPaymentConfirm(true)} disabled={selectedTxIds.length === 0} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/5 disabled:text-white/20 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-900/50 relative z-10">Seçilenleri Öde ({selectedTxIds.length})</button></GlassCard>
        </div>
        <GlassCard className="lg:col-span-2 overflow-hidden bg-[#1c1c1e] border-white/10 flex flex-col h-[600px]">
          <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center"><h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Finansal Hareketler</h3><span className="text-xs text-white/30">Listeden ödemeleri seçerek toplu işlem yapabilirsiniz.</span></div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest sticky top-0 backdrop-blur-md z-10"><tr><th className="p-4 w-10 text-center">Seç</th><th className="p-4">Tarih / Açıklama</th><th className="p-4 text-center">İşlem</th><th className="p-4 text-right">Tutar</th><th className="p-4 text-center">Durum</th></tr></thead>
              <tbody className="divide-y divide-white/5">{[...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (<tr key={t.id} className={`hover:bg-white/[0.02] transition-colors ${selectedTxIds.includes(t.id) ? 'bg-indigo-500/10' : ''}`}><td className="p-4 text-center">{t.type === 'EXPENSE' && !t.isPaid && (<input type="checkbox" checked={selectedTxIds.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 rounded border-white/30 bg-black/50 checked:bg-indigo-500 transition-all cursor-pointer" />)}</td><td className="p-4"><div className="text-white/90 font-medium">{t.description}</div><div className="text-white/30 text-xs mt-1">{formatDate(t.date)}</div></td><td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.type === 'INCOME' ? 'GELİR' : 'GİDER'}</span></td><td className="p-4 text-right font-light text-white text-lg">{t.amount.toLocaleString('tr-TR')} ₺</td><td className="p-4 text-center">
                  <button onClick={() => togglePaid(t.id)} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${t.isPaid ? 'bg-emerald-500/10 text-emerald-500 hover:bg-rose-500/10 hover:text-rose-500 group' : 'text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-500'}`}>
                      {t.isPaid ? (
                          <>
                            <span className="group-hover:hidden flex items-center gap-1"><Check size={12}/> ÖDENDİ</span>
                            <span className="hidden group-hover:flex items-center gap-1"><RotateCcw size={12}/> GERİ AL</span>
                          </>
                      ) : "ÖDE"}
                  </button>
              </td></tr>))}</tbody>
            </table>
          </div>
        </GlassCard>
      </div>
      {showPaymentConfirm && (<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"><GlassCard className="w-full max-w-sm bg-[#1c1c1e] border-white/20 shadow-2xl transform scale-100"><div className="p-6 text-center"><div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400"><Wallet size={32}/></div><h3 className="text-xl font-bold text-white mb-2">Ödeme Onayı</h3><p className="text-white/60 text-sm mb-6">Toplam <strong>{selectedTxIds.length}</strong> adet gider için<br/><span className="text-white font-bold text-lg">{selectedTotal.toLocaleString('tr-TR')} ₺</span><br/>tutarında ödeme yapılacaktır.</p><div className="bg-white/5 rounded-xl p-4 mb-6 text-sm"><div className="flex justify-between mb-2"><span className="text-white/50">Mevcut Kasa:</span><span className="text-white">{netBalance.toLocaleString('tr-TR')} ₺</span></div><div className="flex justify-between pt-2 border-t border-white/10"><span className="text-white/50">Kalan Bakiye:</span><span className={`${projectedBalance < 0 ? 'text-rose-500' : 'text-emerald-500'} font-bold`}>{projectedBalance.toLocaleString('tr-TR')} ₺</span></div></div><div className="flex gap-3"><button onClick={() => setShowPaymentConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">Vazgeç</button><button onClick={handleBulkPayment} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors">Onayla ve Öde</button></div></div></GlassCard></div>)}
    </div>
  );
}

// --- TRAINERS VIEW ---
function TrainersView({ trainers, setTrainers }: any) {
  const [formData, setFormData] = useState<Partial<Trainer>>({});
  const [showModal, setShowModal] = useState(false);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (formData.id) { setTrainers(trainers.map((t: Trainer) => t.id === formData.id ? { ...t, ...formData } : t)); } else { setTrainers([...trainers, { ...formData, id: generateId() }]); } setShowModal(false); setFormData({}); };
  const openEditModal = (trainer: Trainer) => { setFormData(trainer); setShowModal(true); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-light text-white">Eğitmen Kadrosu</h1><PrimaryButton onClick={() => { setFormData({}); setShowModal(true); }} className="px-6 flex items-center gap-2"><Plus size={18} /> Eğitmen Ekle</PrimaryButton></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trainers.map((t: Trainer) => (
          <GlassCard key={t.id} className="p-8 flex flex-col items-center text-center group relative overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditModal(t)} className="p-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white rounded-full transition-colors"><Pencil size={14} /></button><button onClick={() => setTrainers(trainers.filter((tr: Trainer) => tr.id !== t.id))} className="p-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-full transition-colors"><Trash2 size={14} /></button></div>
            <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">🧘‍♂️</div>
            <h3 className="text-xl font-medium text-white">{t.firstName} {t.lastName}</h3>
            <span className="bg-white/5 text-white/60 px-4 py-1 rounded-full text-xs mt-2 border border-white/5">Pilates Eğitmeni</span>
            <div className="mt-4 flex gap-3 text-white/60">{t.phone && <div className="p-2 bg-white/5 rounded-full" title={t.phone}><Phone size={14} /></div>}{t.email && <div className="p-2 bg-white/5 rounded-full" title={t.email}><Mail size={14} /></div>}</div>
            <div className="grid grid-cols-2 w-full gap-4 mt-8 pt-8 border-t border-white/5"><div><p className="text-[10px] text-white/30 uppercase tracking-widest">Komisyon</p><p className="text-lg text-emerald-400 mt-1">%{t.rate}</p></div><div><p className="text-[10px] text-white/30 uppercase tracking-widest">Başlangıç</p><p className="text-lg text-white/80 mt-1">{formatDate(t.startDate).split(' ')[1]} {formatDate(t.startDate).split(' ')[2]}</p></div></div>
          </GlassCard>
        ))}
      </div>
      {showModal && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><GlassCard className="w-full max-w-md bg-[#1c1c1e] border-white/10"><div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">{formData.id ? 'Eğitmen Düzenle' : 'Yeni Eğitmen'}</h3><button onClick={() => setShowModal(false)}><X className="text-white/50" /></button></div><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><PillInput required placeholder="Ad" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} /><PillInput required placeholder="Soyad" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div><PillInput placeholder="Telefon" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /><PillInput placeholder="E-posta" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /><div className="grid grid-cols-2 gap-4"><PillInput required placeholder="Komisyon (%)" type="number" value={formData.rate || ''} onChange={e => setFormData({...formData, rate: parseInt(e.target.value)})} /><PillInput required type="date" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div><PrimaryButton className="w-full mt-4">{formData.id ? 'Değişiklikleri Kaydet' : 'Kaydet'}</PrimaryButton></form></GlassCard></div>}
    </div>
  );
}

// --- LESSONS VIEW ---
function LessonsView({ lessons, setLessons, members, trainers, toggleLessonStatus }: any) {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Lesson>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const weekDates = useMemo(() => {
    const start = new Date(currentWeekStart);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [currentWeekStart]);

  const uniqueGroups = useMemo(() => { const groups = new Map(); members.forEach((m: Member) => { if (m.groupId && m.groupName) { if (!groups.has(m.groupId)) { groups.set(m.groupId, { id: m.groupId, name: m.groupName }); } } }); return Array.from(groups.values()); }, [members]);

  const handleCellClick = (date: string, time: number) => {
    setSelectedLesson(null);
    setFormData({ date, startTime: `${time.toString().padStart(2, '0')}:00`, endTime: `${(time + 1).toString().padStart(2, '0')}:00`, type: 'mat', trainerId: '', memberIds: [], groupId: '', groupName: '' });
    setShowModal(true);
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFormData(lesson);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLesson) return; 

    setIsSyncing(true);
    let selectedMemberIds = formData.memberIds || [];
    let title = formData.title || 'Ders';

    if (formData.type === 'group' && formData.groupId) {
      const groupMembers = members.filter((m: Member) => m.groupId === formData.groupId);
      selectedMemberIds = groupMembers.map((m: Member) => m.id);
      title = `${formData.groupName} Dersi`;
    } else if (formData.memberIds && formData.memberIds.length > 0) {
       const member = members.find((m: Member) => m.id === formData.memberIds![0]);
       if (member) title = `${member.firstName} ${member.lastName} Dersi`;
    }

    const newLesson = { ...formData, id: generateId(), isCompleted: false, memberIds: selectedMemberIds, title } as Lesson;
    const trainer = trainers.find((t: Trainer) => t.id === newLesson.trainerId);
    const lessonMembers = members.filter((m: Member) => selectedMemberIds.includes(m.id));
    
    // Google Takvim URL'ini aç
    openGoogleCalendar(newLesson, lessonMembers, trainer);
    
    setLessons([...lessons, newLesson]);
    setIsSyncing(false);
    setShowModal(false);
  };

  const handleToggleComplete = () => {
      if (selectedLesson) {
          toggleLessonStatus(selectedLesson);
          setShowModal(false);
      }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-light text-white">Stüdyo Programı</h1><GlassCard className="flex items-center gap-6 px-2 py-1 bg-black/40 rounded-full"><IconButton onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate()-7); setCurrentWeekStart(d); }}><ChevronLeft size={20} /></IconButton><span className="font-medium text-white/80 min-w-[200px] text-center">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</span><IconButton onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate()+7); setCurrentWeekStart(d); }}><ChevronRight size={20} /></IconButton></GlassCard></div>
      <GlassCard className="flex-1 overflow-hidden flex flex-col shadow-2xl bg-[#18181b]/60 border-white/5">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-8 border-b border-white/5 bg-white/5">
              <div className="p-4 border-r border-white/5 text-white/30 text-center text-xs font-bold uppercase tracking-widest sticky left-0 bg-[#252528] z-10 shadow-lg">Saat</div>
              {weekDates.map((date, i) => (<div key={date} className="p-4 border-r border-white/5 text-center last:border-r-0"><div className="text-rose-400 text-xs font-bold uppercase mb-1 tracking-widest">{WEEKDAYS[i]}</div><div className="text-white text-xl font-light">{date.split('-')[2]}</div></div>))}
            </div>
            <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-250px)]">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-white/5 min-h-[120px]">
                  <div className="border-r border-white/5 p-4 text-xs text-white/30 text-center font-medium bg-[#1e1e20] sticky left-0 z-10 shadow-lg">{`${hour.toString().padStart(2, '0')}:00`}</div>
                  {weekDates.map(date => {
                    const cellLessons = lessons.filter((l: Lesson) => l.date === date && parseInt(l.startTime.split(':')[0]) === hour);
                    return (
                      <div key={`${date}-${hour}`} className="border-r border-white/5 p-2 hover:bg-white/[0.02] transition-colors relative group" onClick={() => handleCellClick(date, hour)}>
                        <div className="flex flex-wrap gap-1">
                          {cellLessons.map(lesson => (
                             <div key={lesson.id} onClick={(e) => { e.stopPropagation(); handleLessonClick(lesson); }} className={`p-1.5 rounded-lg text-[10px] border cursor-pointer shadow-sm transition-all hover:scale-105 hover:z-10 relative flex items-center gap-2 max-w-full group/item ${lesson.isCompleted ? 'bg-zinc-800/80 border-zinc-700 text-zinc-400' : lesson.type === 'group' ? 'bg-purple-500/10 border-purple-500/30 text-purple-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'}`}>
                               {lesson.isCompleted ? <Check size={10} className="shrink-0" /> : <div className="w-2 h-2 rounded-full bg-current opacity-50 shrink-0" />}
                               <div className="truncate font-medium flex-1">{lesson.title}</div>
                               {lesson.googleCalendarEventId && (<div className="text-white/30 p-1" title="Google Takvim'e İşlendi"><CalendarCheck size={10} /></div>)}
                             </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none"><div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400"><Plus size={14}/></div></div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><GlassCard className="w-full max-w-md bg-[#1c1c1e] border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"><div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">{selectedLesson ? 'Ders Detayları' : 'Ders Planla'}</h3><button onClick={() => setShowModal(false)}><X className="text-white/50 hover:text-white" /></button></div>{selectedLesson ? (<div className="p-6 space-y-6"><div className="space-y-4"><div className="flex items-center justify-between"><h4 className="text-lg font-bold text-white">{selectedLesson.title}</h4><span className={`text-xs px-2 py-1 rounded uppercase ${selectedLesson.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{selectedLesson.isCompleted ? 'Tamamlandı' : 'Bekliyor'}</span></div><div className="grid grid-cols-2 gap-4 text-sm text-white/60"><div><p className="text-xs text-white/30 uppercase">Tarih</p>{formatDate(selectedLesson.date)}</div><div><p className="text-xs text-white/30 uppercase">Saat</p>{selectedLesson.startTime} - {selectedLesson.endTime}</div></div>{selectedLesson.googleCalendarEventId && (<div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 p-2 rounded"><CalendarCheck size={14} /> Google Takvim ile Senkronize</div>)}
      </div><div className="pt-6 border-t border-white/10">{selectedLesson.isCompleted ? (<PrimaryButton onClick={handleToggleComplete} className="w-full bg-slate-700 hover:bg-slate-600"><RefreshCcw size={18} /> Geri Al (Tamamlanmadı Yap)</PrimaryButton>) : (<PrimaryButton onClick={handleToggleComplete} className="w-full bg-emerald-600 hover:bg-emerald-700"><Check size={18} /> Dersi Tamamla & Bakiyeden Düş</PrimaryButton>)}<p className="text-[10px] text-white/30 text-center mt-3">{selectedLesson.isCompleted ? "Geri alındığında üyeye ders hakkı iade edilir ve hoca ödemesi iptal edilir." : "Ders tamamlandığında üyeden 1 ders düşülür ve hocaya hakediş yazılır."}</p></div></div>) : (
      <form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Eğitmen</label><PillSelect required value={formData.trainerId} onChange={e => setFormData({...formData, trainerId: e.target.value})}><option value="">Seçiniz...</option>{trainers.map((t: Trainer) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</PillSelect></div><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Ders Tipi</label><PillSelect required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="mat">Mat Pilates</option><option value="reformer">Reformer</option><option value="pregnant">Hamile Pilatesi</option><option value="group">Grup Ders</option></PillSelect></div>{formData.type === 'group' ? (<div className="space-y-2 animate-in fade-in"><label className="text-xs text-white/50 ml-3">Grup Seçimi</label><PillSelect required value={formData.groupId} onChange={e => { const selectedG = uniqueGroups.find((g: any) => g.id === e.target.value); setFormData({...formData, groupId: selectedG?.id, groupName: selectedG?.name}); }}><option value="">Grup Seçiniz...</option>{uniqueGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</PillSelect></div>) : (<div className="space-y-2 animate-in fade-in"><label className="text-xs text-white/50 ml-3">Üye</label><PillSelect required value={formData.memberIds?.[0] || ''} onChange={e => setFormData({...formData, memberIds: [e.target.value]})}><option value="">Seçiniz...</option>{members.filter((m: Member) => !m.groupId).map((m: Member) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.remainingSessions} hak)</option>)}</PillSelect></div>)}<PrimaryButton type="submit" disabled={isSyncing} className="w-full mt-4">Kaydet ve Takvime Ekle</PrimaryButton></form>)}</GlassCard></div>
      )}
    </div>
  );
}

// ==========================================
// 5. ANA UYGULAMA (Main Application)
// ==========================================

function DashboardView({ members, lessons, transactions }: any) {
  const lowBalanceMembers = members.filter((m: Member) => m.remainingSessions <= 2 && m.remainingSessions > 0);
  const today = new Date().toISOString().split('T')[0];
  const todayLessons = lessons.filter((l: Lesson) => l.date === today).sort((a: Lesson,b: Lesson) => a.startTime.localeCompare(b.startTime));
  const income = transactions.filter((t: Transaction) => t.type === 'INCOME').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
  const expense = transactions.filter((t: Transaction) => t.type === 'EXPENSE').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div><h1 className="text-4xl font-light text-white tracking-tight">Merhaba,</h1><p className="text-white/50 mt-1">Bugünün stüdyo durumu harika görünüyor.</p></div>
        <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-sm text-white/70">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<HeartPulse size={24} className="text-rose-400" />} label="Aktif Üyeler" value={members.length} sub="Toplam Kayıt" color="rose" />
        <StatCard icon={<Calendar size={24} className="text-emerald-400" />} label="Bugünkü Ders" value={todayLessons.length} sub="Planlanmış Seans" color="emerald" />
        <StatCard icon={<Wallet size={24} className="text-amber-400" />} label="Tahmini Kasa" value={`${(income - expense).toLocaleString('tr-TR')} ₺`} sub="Güncel Bakiye" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]"><h3 className="font-medium text-lg text-white/90">Paketi Azalanlar</h3><span className="text-[10px] bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full uppercase tracking-wider">Acil Durum</span></div>
          <div className="p-6">
            {lowBalanceMembers.length === 0 ? (
              <EmptyState message="Herkesin paketi yeterli durumda 🌸" />
            ) : (
              <ul className="space-y-4">
                {lowBalanceMembers.map((m: Member) => (
                  <li key={m.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <div><p className="text-white font-medium">{m.firstName} {m.lastName}</p><p className="text-xs text-white/40">{m.phone}</p></div>
                    <div className="flex flex-col items-end"><span className="text-2xl font-light text-rose-400">{m.remainingSessions}</span><span className="text-[10px] text-white/30 uppercase tracking-widest">Ders Kaldı</span></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]"><h3 className="font-medium text-lg text-white/90">Bugünün Akışı</h3></div>
          <div className="p-6">
             {todayLessons.length === 0 ? (
              <EmptyState message="Bugün ders programı boş" />
            ) : (
              <div className="relative border-l border-white/10 ml-3 space-y-6">
                {todayLessons.map((l: Lesson) => (
                  <div key={l.id} className="ml-6 relative">
                    <div className={`absolute -left-[31px] top-2 w-4 h-4 rounded-full border-2 ${l.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-[#141416] border-white/30'}`} />
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="text-center min-w-[60px]"><p className="text-white font-bold text-sm">{l.startTime}</p><p className="text-xs text-white/40">{l.endTime}</p></div>
                      <div className="flex-1"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${l.type === 'group' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>{l.type}</span><p className="text-white/90 font-medium mt-1">{l.title}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function VivaDaPilatesApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [packages, setPackages] = useState<PilatesPackage[]>(DEFAULT_PACKAGES);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (members.length === 0) {
      const pkg1 = packages.find(p => p.id === 'p2')!; 
      const pkg2 = packages.find(p => p.id === 'p3')!; 

      setMembers([
        { 
          id: '1', firstName: 'Ayşe', lastName: 'Yılmaz', phone: '0555 111 22 33', email: 'ayse@test.com', birthDate: '1990-01-01', healthNotes: 'Bel fıtığı başlangıcı', 
          packageId: pkg1.id, packageName: pkg1.name, remainingSessions: 1, totalSessionsPaid: pkg1.sessionCount, pricePaid: 5000, debt: 500, createdAt: new Date().toISOString() 
        },
        { 
          id: '2', firstName: 'Mehmet', lastName: 'Demir', phone: '0555 222 33 44', email: 'mehmet@test.com', birthDate: '1985-05-15', healthNotes: '', 
          packageId: pkg2.id, packageName: pkg2.name, remainingSessions: 6, totalSessionsPaid: pkg2.sessionCount, pricePaid: 2000, debt: 0, 
          groupId: 'g1', groupName: 'Sabah Grubu', createdAt: new Date().toISOString() 
        }
      ]);
      setTrainers([
        { id: '1', firstName: 'Çağkan', lastName: 'Hoca', phone: '0531 733 75 43', email: 'cagkan@viva.com', rate: 50, startDate: '2023-01-01' },
        { id: '2', firstName: 'Eren', lastName: 'Hoca', phone: '0553 288 00 41', email: 'eren@viva.com', rate: 45, startDate: '2023-02-01' }
      ]);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (PASSWORDS[loginUser] === loginPass) {
      const role: UserRole = MOCK_ADMINS.includes(loginUser) ? 'ADMIN' : 'STAFF';
      setCurrentUser({ username: loginUser, role, name: loginUser.charAt(0).toUpperCase() + loginUser.slice(1) });
      setLoginError('');
    } else {
      setLoginError('Hatalı bilgiler');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUser('');
    setLoginPass('');
  };

  const toggleLessonStatus = (lesson: Lesson) => {
    const isCompleting = !lesson.isCompleted;

    const updatedLessons = lessons.map(l => l.id === lesson.id ? { ...l, isCompleted: isCompleting } : l);
    setLessons(updatedLessons);

    const updatedMembers = members.map(m => {
      if (lesson.memberIds.includes(m.id)) {
        return { 
          ...m, 
          remainingSessions: isCompleting 
            ? m.remainingSessions - 1 
            : m.remainingSessions + 1 
        };
      }
      return m;
    });
    setMembers(updatedMembers);
    
    if (isCompleting) {
      let totalLessonRevenueForCalc = 0;
      lesson.memberIds.forEach(mId => {
        const member = members.find(m => m.id === mId);
        if (member && member.totalSessionsPaid > 0) {
          totalLessonRevenueForCalc += member.pricePaid / member.totalSessionsPaid;
        }
      });

      const trainer = trainers.find(t => t.id === lesson.trainerId);
      if (trainer) {
        setTransactions(prev => [...prev, {
          id: generateId(),
          date: new Date().toISOString(),
          type: 'EXPENSE',
          category: 'TRAINER_PAYMENT',
          description: `Hakediş: ${trainer.firstName} ${trainer.lastName} (${lesson.title})`,
          amount: parseFloat(((totalLessonRevenueForCalc * trainer.rate) / 100).toFixed(2)),
          relatedId: lesson.id,
          isPaid: false 
        }]);
      }
    } else {
      setTransactions(prev => prev.filter(t => t.relatedId !== lesson.id));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-[100px]" />
        <GlassCard className="w-full max-w-md p-10 relative z-10 border-white/5 bg-black/40">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-rose-400 to-rose-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-rose-500/30">
               <img src={LOGO_URL} alt="Logo" className="w-16 h-16 rounded-full object-cover" />
            </div>
            <h1 className="text-3xl font-light text-white tracking-[0.2em]">VIVA DA</h1>
            <p className="text-rose-400/80 text-sm tracking-widest mt-1 font-medium">PILATES STUDIO</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <PillInput value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="Kullanıcı Adı" />
            <PillInput type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Şifre" />
            {loginError && <div className="text-red-400 text-sm text-center">{loginError}</div>}
            <PrimaryButton type="submit" className="w-full mt-4">Giriş Yap</PrimaryButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141416] text-slate-200 flex font-sans selection:bg-rose-500/30 relative">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <aside className="w-72 hidden md:flex flex-col fixed h-full z-20 p-6">
        <GlassCard className="h-full flex flex-col bg-black/20 border-white/5">
          <div className="p-8 flex flex-col items-center border-b border-white/5">
            <div className="w-14 h-14 bg-gradient-to-tr from-rose-400 to-rose-600 rounded-2xl rotate-3 flex items-center justify-center mb-4 shadow-lg shadow-rose-900/40">
              <img src={LOGO_URL} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
            </div>
            <h2 className="text-lg font-light text-white tracking-widest">VIVA DA</h2>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <SidebarItem icon={<Menu size={18} />} label="Genel Bakış" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={<Users size={18} />} label="Üyeler & Gruplar" active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
            <SidebarItem icon={<Calendar size={18} />} label="Takvim" active={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} />
            {currentUser.role === 'ADMIN' && <SidebarItem icon={<UserCog size={18} />} label="Eğitmenler" active={activeTab === 'trainers'} onClick={() => setActiveTab('trainers')} />}
            <SidebarItem icon={<Box size={18} />} label="Paketler" active={activeTab === 'packages'} onClick={() => setActiveTab('packages')} />
            {currentUser.role === 'ADMIN' && <SidebarItem icon={<Wallet size={18} />} label="Finans" active={activeTab === 'accounting'} onClick={() => setActiveTab('accounting')} />}
          </nav>
          <div className="p-6 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-rose-400 hover:bg-white/5 px-3 py-3 rounded-2xl transition-all duration-300 text-sm"><LogOut size={16} /> Çıkış</button>
          </div>
        </GlassCard>
      </aside>

      <main className="flex-1 md:ml-72 p-4 md:p-8 overflow-y-auto h-screen relative z-10">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView members={members} lessons={lessons} transactions={transactions} />}
          {activeTab === 'members' && <MembersView members={members} setMembers={setMembers} packages={packages} setTransactions={setTransactions} />}
          {activeTab === 'lessons' && <LessonsView lessons={lessons} setLessons={setLessons} members={members} trainers={trainers} toggleLessonStatus={toggleLessonStatus} />}
          {activeTab === 'trainers' && currentUser.role === 'ADMIN' && <TrainersView trainers={trainers} setTrainers={setTrainers} />}
          {activeTab === 'packages' && <PackagesView packages={packages} setPackages={setPackages} />}
          {activeTab === 'accounting' && currentUser.role === 'ADMIN' && <AccountingView transactions={transactions} setTransactions={setTransactions} />}
        </div>
      </main>
    </div>
  );
}
