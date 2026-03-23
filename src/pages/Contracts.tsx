import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Search, FileText, Calendar, DollarSign, Trash2, Edit2, ExternalLink, AlertCircle, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, isAfter, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Modal } from '../components/Modal';

export default function Contracts() {
  const { contracts, suppliers, addContract, updateContract, deleteContract, addSupplier } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newContract, setNewContract] = useState({
    title: '',
    supplierId: '',
    category: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    value: 0,
    paymentFrequency: 'MENSAL' as const,
    status: 'ACTIVE' as const,
    notes: ''
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    category: 'GERAL' as 'LIMPEZA' | 'PISCINA' | 'GERAL' | 'MANUTENCAO' | 'SEGURANCA'
  });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) {
      toast.error('O nome do fornecedor é obrigatório');
      return;
    }
    addSupplier(supplierForm);
    setIsAddingSupplier(false);
    setSupplierForm({ name: '', contact: '', phone: '', email: '', category: 'GERAL' });
  };

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddContract = () => {
    if (!newContract.title || !newContract.supplierId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    addContract(newContract);
    setIsAdding(false);
    setNewContract({
      title: '', supplierId: '', category: '', startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'), value: 0,
      paymentFrequency: 'MENSAL', status: 'ACTIVE', notes: ''
    });
    toast.success('Contrato adicionado!');
  };

  const getStatusColor = (status: string, endDate: string) => {
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (isAfter(new Date(), new Date(endDate))) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Contratos</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Gerencie contratos de prestação de serviços e fornecedores</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Contrato
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar contratos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cadastrar Novo Contrato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Título</label>
              <input
                type="text"
                value={newContract.title}
                onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="Ex: Manutenção de Elevadores"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Fornecedor</label>
                <button 
                  type="button"
                  onClick={() => setIsAddingSupplier(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  Novo Fornecedor
                </button>
              </div>
              <select
                value={newContract.supplierId}
                onChange={(e) => setNewContract({ ...newContract, supplierId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
              >
                <option value="">Selecione um fornecedor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Categoria</label>
              <input
                type="text"
                value={newContract.category}
                onChange={(e) => setNewContract({ ...newContract, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="Ex: Manutenção"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Data Início</label>
              <input
                type="date"
                value={newContract.startDate}
                onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Data Fim</label>
              <input
                type="date"
                value={newContract.endDate}
                onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Valor (R$)</label>
              <input
                type="number"
                value={newContract.value}
                onChange={(e) => setNewContract({ ...newContract, value: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancelar</button>
            <button onClick={handleAddContract} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Salvar Contrato</button>
          </div>
        </motion.div>
      )}

      <Modal
        isOpen={isAddingSupplier}
        onClose={() => setIsAddingSupplier(false)}
        title="Cadastrar Novo Fornecedor"
      >
        <form onSubmit={handleAddSupplier} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Nome da Empresa</label>
            <input
              required
              type="text"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
              placeholder="Ex: Elevadores S.A."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Responsável</label>
              <input
                type="text"
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="Nome do contato"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Telefone</label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">E-mail</label>
            <input
              type="email"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
              placeholder="contato@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Categoria</label>
            <select
              value={supplierForm.category}
              onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value as any })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none"
            >
              <option value="GERAL">Geral</option>
              <option value="LIMPEZA">Limpeza</option>
              <option value="PISCINA">Piscina</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="SEGURANCA">Segurança</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setIsAddingSupplier(false)} 
              className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-zinc-950 border-bottom border-gray-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contrato</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vigência</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {filteredContracts.map((contract) => {
              const supplier = suppliers.find(s => s.id === contract.supplierId);
              const isExpired = isAfter(new Date(), new Date(contract.endDate));
              
              return (
                <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{contract.title}</div>
                        <div className="text-xs text-gray-500">{contract.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{supplier?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{supplier?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(contract.startDate), 'dd/MM/yy')} - {format(new Date(contract.endDate), 'dd/MM/yy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                      <DollarSign className="w-3 h-3" />
                      {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      <span className="text-[10px] text-gray-500 ml-1">/{contract.paymentFrequency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(contract.status, contract.endDate)}`}>
                      {isExpired ? 'Expirado' : contract.status === 'ACTIVE' ? 'Ativo' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteContract(contract.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredContracts.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum contrato encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
