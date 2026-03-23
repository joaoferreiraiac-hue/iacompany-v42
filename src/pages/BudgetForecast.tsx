import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { BudgetForecast as BudgetForecastType } from '../types';
import { Brain, TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, Loader2, RefreshCw, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Cell, Pie } from 'recharts';
import { toast } from 'react-hot-toast';

export default function BudgetForecast() {
  const { budgetForecasts, costs, generateBudgetForecastWithAI, addBudgetForecast } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<BudgetForecastType | null>(budgetForecasts[0] || null);

  const handleGenerateForecast = async () => {
    setIsGenerating(true);
    try {
      // Get last 50 costs for context
      const historicalData = costs
        .slice(-50)
        .map(c => ({
          date: c.date,
          category: c.category,
          amount: c.value,
          description: c.description
        }));

      const forecast = await generateBudgetForecastWithAI(historicalData);
      if (forecast) {
        addBudgetForecast(forecast);
        setSelectedForecast(forecast);
        toast.success('Previsão gerada com sucesso pela IA!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar previsão. Verifique sua chave de API.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (budgetForecasts.length > 0 && !selectedForecast) {
      setSelectedForecast(budgetForecasts[0]);
    }
  }, [budgetForecasts, selectedForecast]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Previsão Orçamentária Inteligente
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">IA analisando seus gastos históricos para prever o futuro financeiro</p>
        </div>
        <button
          onClick={handleGenerateForecast}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isGenerating ? 'Analisando Dados...' : 'Gerar Nova Previsão'}
        </button>
      </div>

      {!selectedForecast && !isGenerating ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhuma previsão disponível</h2>
          <p className="text-gray-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Nossa IA pode analisar seus recibos e despesas passadas para criar um orçamento detalhado para os próximos meses.
          </p>
          <button
            onClick={handleGenerateForecast}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Começar Análise
          </button>
        </div>
      ) : selectedForecast ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Forecast View */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Projeção de Gastos Mensais
                </h3>
                <div className="text-sm text-gray-400">
                  Gerado em: {format(new Date(selectedForecast.createdAt), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedForecast.monthlyProjections}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Previsto']}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-emerald-500" />
                  Distribuição por Categoria
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedForecast.categories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {selectedForecast.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {selectedForecast.categories.map((cat, index) => (
                    <div key={cat.name} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Insights da IA
                </h3>
                <div className="space-y-4">
                  {selectedForecast.insights.map((insight, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800">
                      <div className="mt-1">
                        {insight.toLowerCase().includes('reduz') || insight.toLowerCase().includes('econom') ? (
                          <TrendingDown className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sidebar - History & Quick Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
              <h3 className="text-sm font-medium opacity-80 mb-1">Total Previsto (Próx. 6 meses)</h3>
              <div className="text-3xl font-bold mb-4">
                R$ {selectedForecast.monthlyProjections.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR')}
              </div>
              <div className="flex items-center gap-2 text-xs bg-white/10 w-fit px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span>Baseado em {costs.length} registros históricos</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Histórico de Previsões</h3>
              <div className="space-y-3">
                {budgetForecasts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedForecast(f)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedForecast.id === f.id ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Previsão de {format(new Date(f.createdAt), 'MMMM yyyy', { locale: ptBR })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {f.categories.length} categorias analisadas
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
