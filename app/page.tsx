"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs 
} from "firebase/firestore";
import { 
  Calendar, Users, UserCog, LogOut, 
  Plus, Trash2, Check, X, ChevronLeft, ChevronRight, 
  Search, AlertCircle, Menu, Wallet, HeartPulse, CreditCard, RefreshCcw, Phone, Mail, Box, Pencil, CalendarCheck, TrendingUp, Calculator, Upload, Users2
} from 'lucide-react';

// ==========================================
// 1. FIREBASE AYARLARI
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyCq_X4ug43w10h0owiWb59ha_HWzI1d6sQ",
  authDomain: "viva-pilates-app.firebaseapp.com",
  projectId: "viva-pilates-app",
  storageBucket: "viva-pilates-app.firebasestorage.app",
  messagingSenderId: "318630534142",
  appId: "1:318630534142:web:99497a1e4f0fbc4de4feaf"
};

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 2. TİP TANIMLAMALARI VE SABİTLER
// ==========================================

const LOGO_URL = "/logo.jpg"; 

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
  packageName: string;       
  remainingSessions: number; 
  balance: number;           
  groupId?: string;          
  groupName?: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  memberIds: string[];
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
}

interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
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
// 3. YARDIMCI FONKSİYONLAR & HOOKS
// ==========================================

// Firebase Collection Hook (Canlı Veri Akışı)
function useFirebaseCollection<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Veritabanına abone ol (Real-time listener)
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Firebase Error (${collectionName}):`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  // Ekleme Fonksiyonu
  const add = async (item: any) => {
    try {
      // ID'yi çakışma olmasın diye siliyoruz, Firebase kendi ID'sini verecek
      const { id, ...rest } = item; 
      await addDoc(collection(db, collectionName), rest);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Kayıt eklenirken hata oluştu!");
    }
  };

  // Güncelleme Fonksiyonu
  const update = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("Güncelleme sırasında hata oluştu!");
    }
  };

  // Silme Fonksiyonu
  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert("Silme işlemi başarısız!");
    }
  };

  return { data, loading, add, update, remove };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
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
// 4. UI BİLEŞENLERİ
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
// 5. ALT SAYFALAR (VIEW COMPONENTS)
// ==========================================

// --- MEMBERS & GROUPS VIEW ---
function MembersView({ members, addMember, updateMember, deleteMember, packages, addTransaction, groups, addGroup, deleteGroup }: any) {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'GROUPS' | 'IMPORT'>('MEMBERS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState<Member | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  const [formData, setFormData] = useState<any>({});
  const [importText, setImportText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // --- ÜYE İŞLEMLERİ ---
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPackage = packages.find((p: PilatesPackage) => p.id === formData.packageId);
    
    const isPaid = formData.isPaid === true;
    const initialDebt = selectedPackage && !isPaid ? -selectedPackage.price : 0;
    const initialBalance = parseFloat(formData.initialBalance) || 0;
    
    const newMember: Member = {
      id: generateId(),
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      phone: formData.phone || "",
      email: formData.email || "",
      birthDate: formData.birthDate || "",
      healthNotes: formData.healthNotes || "",
      packageName: selectedPackage?.name || "Paketsiz",
      remainingSessions: (selectedPackage?.sessionCount || 0) + (parseInt(formData.extraSessions) || 0),
      balance: initialBalance + initialDebt,
      createdAt: new Date().toISOString()
    };

    addMember(newMember);
    
    if (selectedPackage && isPaid) {
      addTransaction({
        id: generateId(),
        date: new Date().toISOString(),
        type: 'INCOME',
        category: 'MEMBER_PAYMENT',
        description: `Yeni Üye Ödemesi: ${newMember.firstName} ${newMember.lastName} (${selectedPackage.name})`,
        amount: selectedPackage.price,
        isPaid: true
      });
    }

    if (initialBalance > 0) {
        addTransaction({
            id: generateId(),
            date: new Date().toISOString(),
            type: 'INCOME',
            category: 'MEMBER_PAYMENT',
            description: `Açılış Bakiyesi: ${newMember.firstName} ${newMember.lastName}`,
            amount: initialBalance,
            isPaid: true
        });
    }

    setShowAddModal(false);
    setFormData({});
  };

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTopUpModal) return;

    const addedSessions = parseInt(formData.addSessions) || 0;
    const addedBalance = parseFloat(formData.addBalance) || 0; 
    const paymentAmount = parseFloat(formData.paymentAmount) || 0; 
    const packageId = formData.packageId;
    const selectedPackage = packages.find((p: PilatesPackage) => p.id === packageId);

    let finalSessions = showTopUpModal.remainingSessions + addedSessions;
    let finalBalance = showTopUpModal.balance + addedBalance + paymentAmount;

    if (selectedPackage) {
        finalSessions += selectedPackage.sessionCount;
        finalBalance -= selectedPackage.price;
    }

    // Update in Firestore
    updateMember(showTopUpModal.id, {
        remainingSessions: finalSessions,
        balance: finalBalance,
        packageName: selectedPackage ? selectedPackage.name : showTopUpModal.packageName
    });

    if (paymentAmount > 0) {
        addTransaction({
            id: generateId(),
            date: new Date().toISOString(),
            type: 'INCOME',
            category: 'MEMBER_PAYMENT',
            description: `Tahsilat: ${showTopUpModal.firstName} ${showTopUpModal.lastName}`,
            amount: paymentAmount,
            isPaid: true
        });
    }

    if (addedBalance > 0) {
        addTransaction({
            id: generateId(),
            date: new Date().toISOString(),
            type: 'INCOME',
            category: 'MEMBER_PAYMENT',
            description: `Bakiye Yükleme (Manuel): ${showTopUpModal.firstName} ${showTopUpModal.lastName}`,
            amount: addedBalance,
            isPaid: true
        });
    }

    setShowTopUpModal(null);
    setFormData({});
  };

  // --- GRUP İŞLEMLERİ ---
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const newGroup: Group = {
        id: generateId(),
        name: formData.groupName,
        memberIds: formData.selectedMembers || []
    };
    
    addGroup(newGroup);
    
    if (newGroup.memberIds.length > 0) {
        newGroup.memberIds.forEach(mId => {
            updateMember(mId, { groupId: newGroup.id, groupName: newGroup.name });
        });
    }
    
    setShowGroupModal(false);
    setFormData({});
  };

  // --- TOPLU YÜKLEME ---
  const handleBulkImport = () => {
    const lines = importText.split('\n');
    let count = 0;
    
    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
            addMember({
                id: generateId(),
                firstName: parts[0]?.trim() || "",
                lastName: parts[1]?.trim() || "",
                phone: parts[2]?.trim() || "",
                email: parts[3]?.trim() || "",
                remainingSessions: parseInt(parts[4]) || 0,
                balance: parseFloat(parts[5]) || 0,
                packageName: 'Toplu Yükleme',
                birthDate: '',
                healthNotes: '',
                createdAt: new Date().toISOString()
            });
            count++;
        }
    });

    setImportText("");
    setActiveTab('MEMBERS');
    alert(`${count} üye başarıyla sıraya alındı ve yükleniyor!`);
  };

  const filteredMembers = members.filter((m: Member) => 
    (m.firstName + ' ' + m.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-light text-white">Üye & Grup Yönetimi</h1>
        <div className="flex bg-white/10 rounded-lg p-1">
            <button onClick={() => setActiveTab('MEMBERS')} className={`px-4 py-2 rounded-md text-sm transition-all ${activeTab === 'MEMBERS' ? 'bg-rose-600 text-white' : 'text-white/60 hover:text-white'}`}>Üyeler</button>
            <button onClick={() => setActiveTab('GROUPS')} className={`px-4 py-2 rounded-md text-sm transition-all ${activeTab === 'GROUPS' ? 'bg-rose-600 text-white' : 'text-white/60 hover:text-white'}`}>Gruplar</button>
            <button onClick={() => setActiveTab('IMPORT')} className={`px-4 py-2 rounded-md text-sm transition-all ${activeTab === 'IMPORT' ? 'bg-rose-600 text-white' : 'text-white/60 hover:text-white'}`}>Excel Yükle</button>
        </div>
      </div>

      {activeTab === 'MEMBERS' && (
        <>
            <div className="flex gap-4">
                <div className="relative flex-1">
                <input type="text" placeholder="İsim, telefon veya e-posta ile ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3 text-white focus:outline-none focus:border-rose-500/50" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                </div>
                <PrimaryButton onClick={() => setShowAddModal(true)} className="px-6 flex items-center gap-2"><Plus size={18} /> Üye Ekle</PrimaryButton>
            </div>

            <GlassCard className="overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest">
                    <tr>
                    <th className="p-4">Ad Soyad</th>
                    <th className="p-4">İletişim</th>
                    <th className="p-4">Paket / Grup</th>
                    <th className="p-4">Kalan Ders</th>
                    <th className="p-4">Bakiye</th>
                    <th className="p-4 text-center">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredMembers.map((member: Member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4"><div className="font-medium text-white">{member.firstName} {member.lastName}</div><div className="text-xs text-white/40">{member.healthNotes}</div></td>
                        <td className="p-4"><div className="text-sm text-white/80">{member.phone}</div><div className="text-xs text-white/40">{member.email}</div></td>
                        <td className="p-4"><div className="text-sm text-white/80">{member.packageName}</div><div className="text-xs text-rose-400">{member.groupName}</div></td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${member.remainingSessions <= 2 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{member.remainingSessions}</span></td>
                        <td className="p-4"><span className={`font-mono ${member.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{member.balance} ₺</span></td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                        <button onClick={() => { setFormData({}); setShowTopUpModal(member); }} className="text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-full" title="Paket/Bakiye Yükle"><CreditCard size={18} /></button>
                        <button onClick={() => { if(confirm('Silmek istediğinize emin misiniz?')) deleteMember(member.id) }} className="text-rose-400 hover:bg-rose-500/10 p-2 rounded-full"><Trash2 size={18} /></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </GlassCard>
        </>
      )}

      {activeTab === 'GROUPS' && (
          <div className="space-y-6">
              <div className="flex justify-end"><PrimaryButton onClick={() => setShowGroupModal(true)} className="px-6 flex items-center gap-2"><Users2 size={18} /> Yeni Grup Oluştur</PrimaryButton></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((grp: Group) => (
                    <GlassCard key={grp.id} className="p-6 relative group">
                        <h3 className="text-xl font-bold text-white mb-2">{grp.name}</h3>
                        <p className="text-white/40 text-sm mb-4">{grp.memberIds.length} Üye Kayıtlı</p>
                        <div className="flex -space-x-2 overflow-hidden mb-4">
                            {grp.memberIds.slice(0, 5).map(mid => {
                                const m = members.find((x: Member) => x.id === mid);
                                return m ? <div key={mid} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1c1c1e] bg-rose-500 flex items-center justify-center text-xs text-white font-bold" title={m.firstName}>{m.firstName[0]}</div> : null;
                            })}
                            {grp.memberIds.length > 5 && <div className="h-8 w-8 rounded-full ring-2 ring-[#1c1c1e] bg-white/10 flex items-center justify-center text-xs text-white">+{grp.memberIds.length - 5}</div>}
                        </div>
                        <button onClick={() => { if(confirm('Grubu silmek istiyor musunuz?')) deleteGroup(grp.id) }} className="text-rose-400 text-xs hover:underline">Grubu Sil</button>
                    </GlassCard>
                ))}
              </div>
              {groups.length === 0 && <EmptyState message="Henüz bir grup oluşturulmadı." />}
          </div>
      )}

      {activeTab === 'IMPORT' && (
          <GlassCard className="p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Upload size={24}/> Excel / CSV Toplu Yükleme</h3>
              <p className="text-white/50 text-sm mb-4">Aşağıdaki kutuya Excel'den veya CSV dosyanızdan verileri kopyalayıp yapıştırın. Her satır bir üyeyi temsil etmelidir.</p>
              <div className="bg-black/30 p-4 rounded-xl mb-4 text-xs font-mono text-white/70">
                  FORMAT: Ad, Soyad, Telefon, E-posta, Kalan Ders, Bakiye<br/>
                  ÖRNEK: Ayşe, Yılmaz, 05551112233, ayse@mail.com, 10, 500
              </div>
              <textarea 
                className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm font-mono focus:outline-none focus:border-rose-500"
                placeholder="Verileri buraya yapıştırın..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <PrimaryButton onClick={handleBulkImport} className="w-full mt-4">Yüklemeyi Başlat</PrimaryButton>
          </GlassCard>
      )}

      {/* --- MODALS --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-lg bg-[#1c1c1e] border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">Yeni Üye Kaydı</h3><button onClick={() => setShowAddModal(false)}><X className="text-white/50 hover:text-white" /></button></div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Ad *</label><PillInput required value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Soyad *</label><PillInput required value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Telefon *</label><PillInput required value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-xs text-white/50 ml-2">E-posta *</label><PillInput required type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Başlangıç Paketi</label><PillSelect value={formData.packageId || ''} onChange={e => setFormData({...formData, packageId: e.target.value})}><option value="">Paket Seçiniz...</option>{packages.map((p: PilatesPackage) => <option key={p.id} value={p.id}>{p.name} ({p.price} TL)</option>)}</PillSelect></div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Ekstra Ders Hakkı</label><PillInput type="number" placeholder="0" value={formData.extraSessions || ''} onChange={e => setFormData({...formData, extraSessions: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Açılış Bakiyesi (+/-)</label><PillInput type="number" placeholder="0" value={formData.initialBalance || ''} onChange={e => setFormData({...formData, initialBalance: e.target.value})} /></div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl"><input type="checkbox" className="w-4 h-4" checked={formData.isPaid || false} onChange={e => setFormData({...formData, isPaid: e.target.checked})} /><span className="text-sm text-white">Paket Ücreti Peşin Alındı (Bakiyeyi Düşme)</span></div>
              <PrimaryButton type="submit" className="w-full mt-2">Kaydet</PrimaryButton>
            </form>
          </GlassCard>
        </div>
      )}

      {showTopUpModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md bg-[#1c1c1e] border-white/10">
                <div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">Paket / Bakiye Yükle</h3><button onClick={() => setShowTopUpModal(null)}><X className="text-white/50 hover:text-white" /></button></div>
                <form onSubmit={handleTopUp} className="p-6 space-y-4">
                    <p className="text-white/60 text-sm">Üye: <strong>{showTopUpModal.firstName} {showTopUpModal.lastName}</strong></p>
                    <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Paket Seç (İsteğe Bağlı)</label><PillSelect value={formData.packageId || ''} onChange={e => setFormData({...formData, packageId: e.target.value})}><option value="">Sadece Bakiye/Ders Ekle</option>{packages.map((p: PilatesPackage) => <option key={p.id} value={p.id}>{p.name} ({p.sessionCount} Ders - {p.price} TL)</option>)}</PillSelect></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Manuel Ders Ekle</label><PillInput type="number" placeholder="0" value={formData.addSessions || ''} onChange={e => setFormData({...formData, addSessions: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Manuel Bakiye Ekle</label><PillInput type="number" placeholder="0" value={formData.addBalance || ''} onChange={e => setFormData({...formData, addBalance: e.target.value})} /></div>
                    </div>
                    <div className="space-y-1"><label className="text-xs text-emerald-400/80 ml-2">Tahsil Edilen Tutar (Kasa Girişi)</label><PillInput type="number" placeholder="0" value={formData.paymentAmount || ''} onChange={e => setFormData({...formData, paymentAmount: e.target.value})} className="border-emerald-500/30 bg-emerald-500/5 focus:border-emerald-500" /></div>
                    <PrimaryButton type="submit" className="w-full mt-2">İşlemi Onayla</PrimaryButton>
                </form>
            </GlassCard>
          </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md bg-[#1c1c1e] border-white/10">
                <div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">Yeni Grup Oluştur</h3><button onClick={() => setShowGroupModal(false)}><X className="text-white/50 hover:text-white" /></button></div>
                <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                    <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Grup Adı</label><PillInput required placeholder="Örn: Sabah Pilates Grubu" value={formData.groupName || ''} onChange={e => setFormData({...formData, groupName: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-xs text-white/50 ml-2">Üyeleri Seç (Çoklu Seçim)</label>
                        <select multiple className="w-full h-32 bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-rose-400/50" value={formData.selectedMembers || []} onChange={e => setFormData({...formData, selectedMembers: Array.from(e.target.selectedOptions, option => option.value)})}>
                            {members.map((m: Member) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                        </select>
                        <p className="text-[10px] text-white/30 ml-2">* Ctrl (Windows) veya Cmd (Mac) tuşuna basılı tutarak birden fazla kişi seçebilirsiniz.</p>
                    </div>
                    <PrimaryButton type="submit" className="w-full mt-2">Grubu Oluştur</PrimaryButton>
                </form>
            </GlassCard>
        </div>
      )}

    </div>
  );
}

// --- PACKAGES VIEW ---
function PackagesView({ packages, addPackage, updatePackage, deletePackage }: any) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<PilatesPackage>>({});
  
  const handleSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (formData.id) { 
        updatePackage(formData.id, formData);
      } else { 
        addPackage({ ...formData, id: generateId() }); 
      } 
      setShowModal(false); 
      setFormData({}); 
  };
  
  const handleDelete = (id: string) => { 
      if (confirm('Bu paketi silmek istediğinize emin misiniz?')) { 
        deletePackage(id); 
      } 
  };
  
  const openEditModal = (pkg: PilatesPackage) => { setFormData(pkg); setShowModal(true); };
  const openAddModal = () => { setFormData({ type: 'SINGLE', sessionCount: 1, price: 0 }); setShowModal(true); };
  const getTypeLabel = (type: string) => { switch(type) { case 'GROUP': return 'GRUP DERSİ'; case 'PRIVATE': return 'ÖZEL DERS'; case 'PRIVATE_GROUP': return 'ÖZEL GRUP DERSİ'; default: return 'BİREYSEL'; } };
  const getTypeColor = (type: string) => { switch(type) { case 'GROUP': return 'bg-purple-500/10 text-purple-300 border-purple-500/20'; case 'PRIVATE': return 'bg-amber-500/10 text-amber-300 border-amber-500/20'; case 'PRIVATE_GROUP': return 'bg-orange-500/10 text-orange-300 border-orange-500/20'; default: return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'; } };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-light text-white">Paket Yönetimi</h1><PrimaryButton onClick={openAddModal} className="px-6 flex items-center gap-2"><Plus size={18} /> Yeni Paket Ekle</PrimaryButton></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg: PilatesPackage) => (
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
      {showModal && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><GlassCard className="w-full max-w-md bg-[#1c1c1e] border-white/10"><div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">{formData.id ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</h3><button onClick={() => setShowModal(false)}><X className="text-white/50 hover:text-white" /></button></div><form onSubmit={handleSubmit} className="p-6 space-y-6"><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Paket İsmi</label><PillInput required placeholder="Örn: 6'lı Reformer Paketi" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Paket Türü</label><PillSelect required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="SINGLE">Bireysel (Tek Kişilik)</option><option value="GROUP">Grup (Çok Kişilik)</option><option value="PRIVATE">Özel Ders (VIP)</option><option value="PRIVATE_GROUP">Özel Grup (Değişken)</option></PillSelect></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Ders Adedi</label><PillInput required type="number" min="1" placeholder="6" value={formData.sessionCount || ''} onChange={e => setFormData({...formData, sessionCount: parseInt(e.target.value)})} /></div><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Fiyat (₺)</label><PillInput required type="number" min="0" placeholder="5000" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} /></div></div><div className="bg-white/5 p-4 rounded-2xl text-xs text-white/60"><p>💡 <strong>İpucu:</strong> "Özel Grup" seçeneği, kişi sayısı ve fiyatın standart dışı olduğu durumlar (örn: Duo dersler) içindir.</p></div><PrimaryButton className="w-full mt-2" type="submit">{formData.id ? 'Değişiklikleri Kaydet' : 'Paketi Oluştur'}</PrimaryButton></form></GlassCard></div>}
    </div>
  );
}

// --- ACCOUNTING VIEW ---
function AccountingView({ transactions, addTransaction, updateTransaction, deleteTransaction }: any) {
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

    addTransaction({ 
      id: generateId(), 
      date: new Date().toISOString(), 
      type: formType, 
      category: category, 
      description: finalDesc, 
      amount: parseFloat(amt), 
      isPaid: isPaid 
    }); 
    
    setDesc(''); 
    setAmt(''); 
    setCategory('');
  };

  const togglePaid = (tx: Transaction) => { 
      updateTransaction(tx.id, { isPaid: !tx.isPaid }); 
  };
  
  const toggleSelect = (id: string) => { if (selectedTxIds.includes(id)) { setSelectedTxIds(selectedTxIds.filter(txId => txId !== id)); } else { setSelectedTxIds([...selectedTxIds, id]); } };
  
  const handleBulkPayment = () => { 
      selectedTxIds.forEach(id => updateTransaction(id, { isPaid: true }));
      setSelectedTxIds([]); 
      setShowPaymentConfirm(false); 
  };
  
  const handleDelete = (id: string) => {
      if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
          deleteTransaction(id);
      }
  };

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
                <button type="submit" className={`w-full py-3 rounded-full transition-all font-medium ${formType === 'INCOME' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}>Kaydet</button>
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
              <thead className="bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest sticky top-0 backdrop-blur-md z-10"><tr><th className="p-4 w-10 text-center">Seç</th><th className="p-4">Tarih / Açıklama</th><th className="p-4 text-center">İşlem</th><th className="p-4 text-right">Tutar</th><th className="p-4 text-center">Durum</th><th className="p-4 text-center w-10">Sil</th></tr></thead>
              <tbody className="divide-y divide-white/5">{[...transactions].sort((a: Transaction,b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: Transaction) => (<tr key={t.id} className={`hover:bg-white/[0.02] transition-colors ${selectedTxIds.includes(t.id) ? 'bg-indigo-500/10' : ''}`}><td className="p-4 text-center">{t.type === 'EXPENSE' && !t.isPaid && (<input type="checkbox" checked={selectedTxIds.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 rounded border-white/30 bg-black/50 checked:bg-indigo-500 transition-all cursor-pointer" />)}</td><td className="p-4"><div className="text-white/90 font-medium">{t.description}</div><div className="text-white/30 text-xs mt-1">{formatDate(t.date)}</div></td><td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.type === 'INCOME' ? 'GELİR' : 'GİDER'}</span></td><td className="p-4 text-right font-light text-white text-lg">{t.amount.toLocaleString('tr-TR')} ₺</td><td className="p-4 text-center">
                  <button onClick={() => togglePaid(t)} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${t.isPaid ? 'bg-emerald-500/10 text-emerald-500 hover:bg-rose-500/10 hover:text-rose-500 group' : 'text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-500'}`}>
                      {t.isPaid ? (
                          <>
                            <span className="group-hover:hidden flex items-center gap-1"><Check size={12}/> ÖDENDİ</span>
                            <span className="hidden group-hover:flex items-center gap-1"><RotateCcw size={12}/> GERİ AL</span>
                          </>
                      ) : "ÖDE"}
                  </button>
              </td><td className="p-4 text-center"><button onClick={() => handleDelete(t.id)} className="text-white/20 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button></td></tr>))}</tbody>
            </table>
          </div>
        </GlassCard>
      </div>
      {showPaymentConfirm && (<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"><GlassCard className="w-full max-w-sm bg-[#1c1c1e] border-white/20 shadow-2xl transform scale-100"><div className="p-6 text-center"><div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400"><Wallet size={32}/></div><h3 className="text-xl font-bold text-white mb-2">Ödeme Onayı</h3><p className="text-white/60 text-sm mb-6">Toplam <strong>{selectedTxIds.length}</strong> adet gider için<br/><span className="text-white font-bold text-lg">{selectedTotal.toLocaleString('tr-TR')} ₺</span><br/>tutarında ödeme yapılacaktır.</p><div className="bg-white/5 rounded-xl p-4 mb-6 text-sm"><div className="flex justify-between mb-2"><span className="text-white/50">Mevcut Kasa:</span><span className="text-white">{netBalance.toLocaleString('tr-TR')} ₺</span></div><div className="flex justify-between pt-2 border-t border-white/10"><span className="text-white/50">Kalan Bakiye:</span><span className={`${projectedBalance < 0 ? 'text-rose-500' : 'text-emerald-500'} font-bold`}>{projectedBalance.toLocaleString('tr-TR')} ₺</span></div></div><div className="flex gap-3"><button onClick={() => setShowPaymentConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">Vazgeç</button><button onClick={handleBulkPayment} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors">Onayla ve Öde</button></div></div></GlassCard></div>)}
    </div>
  );
}

// --- TRAINERS VIEW ---
function TrainersView({ trainers, addTrainer, updateTrainer, deleteTrainer }: any) {
  const [formData, setFormData] = useState<any>({});
  const [showModal, setShowModal] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => { 
      e.preventDefault();
      // Form verilerini sayısal değerlere güvenli çevirme
      const rate = parseInt(formData.rate) || 0;
      
      const newTrainer = {
          ...formData,
          rate: rate,
          id: formData.id || generateId()
      };

      if (formData.id) { 
        updateTrainer(formData.id, newTrainer); 
      } else { 
        addTrainer(newTrainer); 
      } 
      setShowModal(false); 
      setFormData({}); 
  };
  
  const openEditModal = (trainer: Trainer) => { setFormData(trainer); setShowModal(true); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-light text-white">Eğitmen Kadrosu</h1><PrimaryButton onClick={() => { setFormData({}); setShowModal(true); }} className="px-6 flex items-center gap-2"><Plus size={18} /> Eğitmen Ekle</PrimaryButton></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trainers.map((t: Trainer) => (
          <GlassCard key={t.id} className="p-8 flex flex-col items-center text-center group relative overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditModal(t)} className="p-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white rounded-full transition-colors"><Pencil size={14} /></button><button onClick={() => deleteTrainer(t.id)} className="p-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-full transition-colors"><Trash2 size={14} /></button></div>
            <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">🧘‍♂️</div>
            <h3 className="text-xl font-medium text-white">{t.firstName} {t.lastName}</h3>
            <span className="bg-white/5 text-white/60 px-4 py-1 rounded-full text-xs mt-2 border border-white/5">Pilates Eğitmeni</span>
            <div className="mt-4 flex gap-3 text-white/60">{t.phone && <div className="p-2 bg-white/5 rounded-full" title={t.phone}><Phone size={14} /></div>}{t.email && <div className="p-2 bg-white/5 rounded-full" title={t.email}><Mail size={14} /></div>}</div>
            <div className="grid grid-cols-2 w-full gap-4 mt-8 pt-8 border-t border-white/5"><div><p className="text-[10px] text-white/30 uppercase tracking-widest">Komisyon</p><p className="text-lg text-emerald-400 mt-1">%{t.rate}</p></div><div><p className="text-[10px] text-white/30 uppercase tracking-widest">Başlangıç</p><p className="text-lg text-white/80 mt-1">{formatDate(t.startDate).split(' ')[1]} {formatDate(t.startDate).split(' ')[2]}</p></div></div>
          </GlassCard>
        ))}
      </div>
      {showModal && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><GlassCard className="w-full max-w-md bg-[#1c1c1e] border-white/10"><div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-light text-white">{formData.id ? 'Eğitmen Düzenle' : 'Yeni Eğitmen'}</h3><button onClick={() => setShowModal(false)}><X className="text-white/50" /></button></div><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs text-white/50 ml-2">Ad *</label><PillInput required value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div><div className="space-y-1"><label className="text-xs text-white/50 ml-2">Soyad *</label><PillInput required value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div></div><div className="space-y-1"><label className="text-xs text-white/50 ml-2">Telefon</label><PillInput value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div><div className="space-y-1"><label className="text-xs text-white/50 ml-2">E-posta</label><PillInput type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs text-white/50 ml-2">Komisyon (%) *</label><PillInput required type="number" value={formData.rate || ''} onChange={e => setFormData({...formData, rate: e.target.value})} /></div><div className="space-y-1"><label className="text-xs text-white/50 ml-2">Başlangıç *</label><PillInput required type="date" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div></div><PrimaryButton type="submit" className="w-full mt-4">{formData.id ? 'Değişiklikleri Kaydet' : 'Kaydet'}</PrimaryButton></form></GlassCard></div>}
    </div>
  );
}

// --- LESSONS VIEW ---
function LessonsView({ lessons, addLesson, updateLesson, deleteLesson, members, trainers, toggleLessonStatus, groups }: any) {
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

    // Grup seçildiyse gruptaki üyeleri bul
    if (formData.type === 'group' && formData.groupId) {
      const selectedGroup = groups.find((g: Group) => g.id === formData.groupId);
      if (selectedGroup) {
          selectedMemberIds = selectedGroup.memberIds;
          title = `${selectedGroup.name} Dersi`;
          formData.groupName = selectedGroup.name;
      }
    } else if (formData.memberIds && formData.memberIds.length > 0) {
       const member = members.find((m: Member) => m.id === formData.memberIds![0]);
       if (member) title = `${member.firstName} ${member.lastName} Dersi`;
    }

    const newLesson = { ...formData, id: generateId(), isCompleted: false, memberIds: selectedMemberIds, title } as Lesson;
    const trainer = trainers.find((t: Trainer) => t.id === newLesson.trainerId);
    const lessonMembers = members.filter((m: Member) => selectedMemberIds.includes(m.id));
    
    // Google Takvim URL'ini aç
    openGoogleCalendar(newLesson, lessonMembers, trainer);
    
    // Add to Firestore
    await addLesson(newLesson);
    
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
      <form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Eğitmen</label><PillSelect required value={formData.trainerId} onChange={e => setFormData({...formData, trainerId: e.target.value})}><option value="">Seçiniz...</option>{trainers.map((t: Trainer) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</PillSelect></div><div className="space-y-2"><label className="text-xs text-white/50 ml-3">Ders Tipi</label><PillSelect required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="mat">Mat Pilates</option><option value="reformer">Reformer</option><option value="pregnant">Hamile Pilatesi</option><option value="group">Grup Ders</option></PillSelect></div>{formData.type === 'group' ? (<div className="space-y-2 animate-in fade-in"><label className="text-xs text-white/50 ml-3">Grup Seçimi</label><PillSelect required value={formData.groupId} onChange={e => { const selectedG = groups.find((g: any) => g.id === e.target.value); setFormData({...formData, groupId: selectedG?.id, groupName: selectedG?.name}); }}><option value="">Grup Seçiniz...</option>{groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</PillSelect></div>) : (<div className="space-y-2 animate-in fade-in"><label className="text-xs text-white/50 ml-3">Üye</label><PillSelect required value={formData.memberIds?.[0] || ''} onChange={e => setFormData({...formData, memberIds: [e.target.value]})}><option value="">Seçiniz...</option>{members.filter((m: Member) => !m.groupId).map((m: Member) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.remainingSessions} hak)</option>)}</PillSelect></div>)}<PrimaryButton type="submit" disabled={isSyncing} className="w-full mt-4">Kaydet ve Takvime Ekle</PrimaryButton></form>)}</GlassCard></div>
      )}
    </div>
  );
}

// ==========================================
// 6. ANA UYGULAMA (Main Application)
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // FIREBASE HOOKS: Canlı Veri Akışı
  const { data: packages, add: addPackage, update: updatePackage, remove: deletePackage } = useFirebaseCollection<PilatesPackage>('packages');
  const { data: members, add: addMember, update: updateMember, remove: deleteMember } = useFirebaseCollection<Member>('members');
  const { data: groups, add: addGroup, update: updateGroup, remove: deleteGroup } = useFirebaseCollection<Group>('groups');
  const { data: trainers, add: addTrainer, update: updateTrainer, remove: deleteTrainer } = useFirebaseCollection<Trainer>('trainers');
  const { data: lessons, add: addLesson, update: updateLesson, remove: deleteLesson } = useFirebaseCollection<Lesson>('lessons');
  const { data: transactions, add: addTransaction, update: updateTransaction, remove: deleteTransaction } = useFirebaseCollection<Transaction>('transactions');

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Paketler veritabanında boşsa varsayılanları yükle
  useEffect(() => {
     // Sadece admin ise ve paketler hiç yoksa yükle (Opsiyonel, çakışmayı önlemek için kapalı)
     // if (packages.length === 0) { ... }
  }, [packages]);

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

  const toggleLessonStatus = async (lesson: Lesson) => {
    const isCompleting = !lesson.isCompleted;

    // 1. Dersi Güncelle
    await updateLesson(lesson.id, { isCompleted: isCompleting });

    // 2. Üyelerin Kalan Haklarını Güncelle
    lesson.memberIds.forEach(mId => {
        const member = members.find(m => m.id === mId);
        if (member) {
            updateMember(member.id, { 
                remainingSessions: isCompleting 
                ? member.remainingSessions - 1 
                : member.remainingSessions + 1 
            });
        }
    });
    
    // 3. Eğitmen Hakedişini Ekle / Sil
    if (isCompleting) {
      const trainer = trainers.find(t => t.id === lesson.trainerId);
      if (trainer) {
        addTransaction({
          id: generateId(),
          date: new Date().toISOString(),
          type: 'EXPENSE',
          category: 'TRAINER_PAYMENT',
          description: `Hakediş: ${trainer.firstName} ${trainer.lastName} (${lesson.title})`,
          amount: 250, 
          relatedId: lesson.id,
          isPaid: false 
        });
      }
    } else {
      // İlgili hakediş kaydını bul ve sil (relatedId ile)
      // Basit çözüm: Front-end'de bulup siliyoruz (daha iyi çözüm backend query ile olurdu)
      const txToDelete = transactions.find(t => t.relatedId === lesson.id);
      if (txToDelete) {
          deleteTransaction(txToDelete.id);
      }
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

      {/* Mobil Menü Butonu */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-rose-600 rounded-full text-white shadow-lg pointer-events-auto"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Mobil Menü Arkaplanı */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden pointer-events-auto" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`w-72 fixed h-full z-40 p-6 transition-transform duration-300 pointer-events-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <GlassCard className="h-full flex flex-col bg-black/20 border-white/5">
          <div className="p-8 flex flex-col items-center border-b border-white/5">
            <div className="w-14 h-14 bg-gradient-to-tr from-rose-400 to-rose-600 rounded-2xl rotate-3 flex items-center justify-center mb-4 shadow-lg shadow-rose-900/40">
              <img src={LOGO_URL} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
            </div>
            <h2 className="text-lg font-light text-white tracking-widest">VIVA DA</h2>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <SidebarItem icon={<Menu size={18} />} label="Genel Bakış" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
            <SidebarItem icon={<Users size={18} />} label="Üyeler & Gruplar" active={activeTab === 'members'} onClick={() => { setActiveTab('members'); setIsSidebarOpen(false); }} />
            <SidebarItem icon={<Calendar size={18} />} label="Takvim" active={activeTab === 'lessons'} onClick={() => { setActiveTab('lessons'); setIsSidebarOpen(false); }} />
            {currentUser.role === 'ADMIN' && <SidebarItem icon={<UserCog size={18} />} label="Eğitmenler" active={activeTab === 'trainers'} onClick={() => { setActiveTab('trainers'); setIsSidebarOpen(false); }} />}
            <SidebarItem icon={<Box size={18} />} label="Paketler" active={activeTab === 'packages'} onClick={() => { setActiveTab('packages'); setIsSidebarOpen(false); }} />
            {currentUser.role === 'ADMIN' && <SidebarItem icon={<Wallet size={18} />} label="Finans" active={activeTab === 'accounting'} onClick={() => { setActiveTab('accounting'); setIsSidebarOpen(false); }} />}
          </nav>
          <div className="p-6 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-rose-400 hover:bg-white/5 px-3 py-3 rounded-2xl transition-all duration-300 text-sm"><LogOut size={16} /> Çıkış</button>
          </div>
        </GlassCard>
      </aside>

      <main className="flex-1 md:ml-72 p-4 md:p-8 overflow-y-auto h-screen relative z-10">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView members={members} lessons={lessons} transactions={transactions} />}
          {activeTab === 'members' && (
            <MembersView 
              members={members} 
              addMember={addMember} 
              updateMember={updateMember} 
              deleteMember={deleteMember}
              packages={packages} 
              addTransaction={addTransaction}
              groups={groups}
              addGroup={addGroup}
              deleteGroup={deleteGroup}
            />
          )}
          {activeTab === 'lessons' && (
            <LessonsView 
              lessons={lessons} 
              addLesson={addLesson}
              updateLesson={updateLesson}
              deleteLesson={deleteLesson}
              members={members} 
              trainers={trainers} 
              toggleLessonStatus={toggleLessonStatus} 
              groups={groups} 
            />
          )}
          {activeTab === 'trainers' && currentUser.role === 'ADMIN' && (
            <TrainersView 
              trainers={trainers} 
              addTrainer={addTrainer}
              updateTrainer={updateTrainer}
              deleteTrainer={deleteTrainer}
            />
          )}
          {activeTab === 'packages' && (
            <PackagesView 
              packages={packages} 
              addPackage={addPackage}
              updatePackage={updatePackage}
              deletePackage={deletePackage}
            />
          )}
          {activeTab === 'accounting' && currentUser.role === 'ADMIN' && (
            <AccountingView 
              transactions={transactions} 
              addTransaction={addTransaction}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
            />
          )}
        </div>
      </main>
    </div>
  );
}
