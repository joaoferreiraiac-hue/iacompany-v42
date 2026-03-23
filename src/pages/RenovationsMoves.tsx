import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Hammer, Truck, Calendar, User, CheckCircle2, XCircle, Clock, Search, FileText, AlertCircle, Building2, UserPlus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/Modal';

export default function RenovationsMoves() {
  const { renovations, moves, clients, addRenovation, updateRenovation, deleteRenovation, addMove, updateMove, deleteMove, addClient } = useStore();
  const [activeTab, setActiveTab] = useState<'RENOVATIONS' | 'MOVES'>('RENOVATIONS');
  const [isAdding, setIsAdding] = useState(false);
  const [step, setStep] = useState<'BUILDING' | 'FORM'>('BUILDING');
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [isAddingResident, setIsAddingResident] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [residentForm, setResidentForm] = useState({
    name: '',
    phone: '',
    tower: '',
    unit: '',
    address: ''
  });

  const [newRenovation, setNewRenovation] = useState({
    clientId: '',
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'PENDING' as const,
    technicianName: ''
  });

  const [newMove, setNewMove] = useState<{
    clientId: string;
    date: string;
    type: 'IN' | 'OUT';
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
    notes: string;
  }>({
    clientId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'IN',
    status: 'PENDING',
    notes: ''
  });

  const filteredRenovations = renovations.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clients.find(c => c.id === r.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMoves = moves.filter(m => 
    clients.find(c => c.id === m.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const towers = Array.from(new Set(clients.map(c => c.tower).filter(Boolean))).sort();

  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addClient({
        ...residentForm,
        email: '',
        document: '',
        contactPerson: '',
        notes: '',
        vehicles: '',
        pets: ''
      });
      setIsAddingResident(false);
      setResidentForm({ name: '', phone: '', tower: '', unit: '', address: '' });
      toast.success('Morador cadastrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao cadastrar morador');
    }
  };

  const handleStartAdding = () => {
    setIsAdding(true);
    setStep('BUILDING');
    setSelectedTower(null);
  };

  const handleSelectTower = (tower: string) => {
    setSelectedTower(tower);
    setStep('FORM');
  };

  const handleAddRenovation = () => {
    if (!newRenovation.clientId || !newRenovation.title) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    addRenovation(newRenovation);
    setIsAdding(false);
    setNewRenovation({ clientId: '', title: '', description: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd'), status: 'PENDING', technicianName: '' });
    toast.success('Obra cadastrada!');
  };

  const handleAddMove = () => {
    if (!newMove.clientId) {
      toast.error('Selecione um morador');
      return;
    }
    addMove(newMove);
    setIsAdding(false);
    setNewMove({ clientId: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'IN', status: 'PENDING', notes: '' });
    toast.success('Mudança agendada!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Obras e Mudanças</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Controle as solicitações de reformas e agendamentos de mudanças</p>
        </div>
        <button
          onClick={handleStartAdding}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'RENOVATIONS' ? 'Nova Obra' : 'Nova Mudança'}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-950 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('RENOVATIONS')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'RENOVATIONS' ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Obras e Reformas
          </div>
        </button>
        <button
          onClick={() => setActiveTab('MOVES')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'MOVES' ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Mudanças
          </div>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por morador ou título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
        />
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === 'FORM' && (
                <button 
                  onClick={() => setStep('BUILDING')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTab === 'RENOVATIONS' ? 'Cadastrar Solicitação de Obra' : 'Agendar Mudança'}
                {step === 'FORM' && selectedTower && ` - Torre ${selectedTower}`}
              </h2>
            </div>
            <button 
              onClick={() => setIsAdding(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {step === 'BUILDING' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-zinc-400">Selecione o prédio/torre para continuar:</p>
                <button
                  onClick={() => setIsAddingResident(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Novo Morador
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {towers.map(tower => (
                  <button
                    key={tower}
                    onClick={() => handleSelectTower(tower!)}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                  >
                    <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Building2 className="w-6 h-6 text-gray-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Torre {tower}</span>
                  </button>
                ))}
                
                {/* Option for clients without tower if any */}
                {clients.some(c => !c.tower) && (
                  <button
                    onClick={() => handleSelectTower('Outros')}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                  >
                    <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Building2 className="w-6 h-6 text-gray-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Outros</span>
                  </button>
                )}
              </div>

              {towers.length === 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                  <p className="text-gray-500 dark:text-zinc-400">Nenhuma torre cadastrada.</p>
                  <button
                    onClick={() => setIsAddingResident(true)}
                    className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    Cadastrar primeiro morador
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'RENOVATIONS' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Morador / Unidade</label>
                    <select
                      value={newRenovation.clientId}
                      onChange={(e) => setNewRenovation({ ...newRenovation, clientId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                    >
                      <option value="">Selecione um morador</option>
                      {clients
                        .filter(c => selectedTower === 'Outros' ? !c.tower : c.tower === selectedTower)
                        .map(c => <option key={c.id} value={c.id}>{c.name} - Apto {c.unit}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Título da Obra</label>
                    <input
                      type="text"
                      value={newRenovation.title}
                      onChange={(e) => setNewRenovation({ ...newRenovation, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                      placeholder="Ex: Reforma da Cozinha"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Data Início</label>
                    <input
                      type="date"
                      value={newRenovation.startDate}
                      onChange={(e) => setNewRenovation({ ...newRenovation, startDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Responsável Técnico (ART)</label>
                    <input
                      type="text"
                      value={newRenovation.technicianName}
                      onChange={(e) => setNewRenovation({ ...newRenovation, technicianName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                      placeholder="Nome do Engenheiro/Arquiteto"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Morador / Unidade</label>
                    <select
                      value={newMove.clientId}
                      onChange={(e) => setNewMove({ ...newMove, clientId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                    >
                      <option value="">Selecione um morador</option>
                      {clients
                        .filter(c => selectedTower === 'Outros' ? !c.tower : c.tower === selectedTower)
                        .map(c => <option key={c.id} value={c.id}>{c.name} - Apto {c.unit}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Tipo</label>
                    <select
                      value={newMove.type}
                      onChange={(e) => setNewMove({ ...newMove, type: e.target.value as 'IN' | 'OUT' })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                    >
                      <option value="IN">Entrada (Move-in)</option>
                      <option value="OUT">Saída (Move-out)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Data da Mudança</label>
                    <input
                      type="date"
                      value={newMove.date}
                      onChange={(e) => setNewMove({ ...newMove, date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setStep('BUILDING')} className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Voltar</button>
                <button
                  onClick={activeTab === 'RENOVATIONS' ? handleAddRenovation : handleAddMove}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal para Adicionar Morador */}
      <Modal
        isOpen={isAddingResident}
        onClose={() => setIsAddingResident(false)}
        title="Cadastrar Novo Morador"
      >
        <form onSubmit={handleAddResident} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Nome Completo</label>
              <input
                required
                type="text"
                value={residentForm.name}
                onChange={(e) => setResidentForm({ ...residentForm, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Torre</label>
              <input
                required
                type="text"
                value={residentForm.tower}
                onChange={(e) => setResidentForm({ ...residentForm, tower: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="Ex: A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Unidade/Apto</label>
              <input
                required
                type="text"
                value={residentForm.unit}
                onChange={(e) => setResidentForm({ ...residentForm, unit: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="Ex: 101"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Telefone</label>
              <input
                required
                type="text"
                value={residentForm.phone}
                onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Endereço</label>
              <input
                required
                type="text"
                value={residentForm.address}
                onChange={(e) => setResidentForm({ ...residentForm, address: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="Rua, Número, Bairro"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsAddingResident(false)} className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Salvar Morador</button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="wait">
          {activeTab === 'RENOVATIONS' ? (
            <motion.div
              key="renovations"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {filteredRenovations.map((renovation) => {
                const client = clients.find(c => c.id === renovation.clientId);
                return (
                  <div key={renovation.id} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Hammer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{renovation.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-3 h-3" />
                          {client?.name} ({client?.tower}{client?.unit})
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(renovation.startDate), 'dd/MM/yyyy')} - {format(new Date(renovation.endDate), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {getStatusIcon(renovation.status)}
                          <span className="capitalize">{renovation.status.toLowerCase().replace('_', ' ')}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Status da Obra</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {renovation.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateRenovation(renovation.id, { status: 'APPROVED' })}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Aprovar"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => updateRenovation(renovation.id, { status: 'REJECTED' })}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Rejeitar"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteRenovation(renovation.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="moves"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {filteredMoves.map((move) => {
                const client = clients.find(c => c.id === move.clientId);
                return (
                  <div key={move.id} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${move.type === 'IN' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                        <Truck className={`w-6 h-6 ${move.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Mudança de {move.type === 'IN' ? 'Entrada' : 'Saída'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-3 h-3" />
                          {client?.name} ({client?.tower}{client?.unit})
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(move.date), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {getStatusIcon(move.status)}
                          <span className="capitalize">{move.status.toLowerCase()}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Status do Agendamento</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {move.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateMove(move.id, { status: 'APPROVED' })}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Aprovar"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => updateMove(move.id, { status: 'CANCELLED' })}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteMove(move.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
        
        {((activeTab === 'RENOVATIONS' && filteredRenovations.length === 0) || 
          (activeTab === 'MOVES' && filteredMoves.length === 0)) && (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma solicitação encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
