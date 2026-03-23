import React, { useEffect } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { GoogleGenAI, Type } from "@google/genai";
import { sendWhatsAppMessage } from '../services/whatsappService';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

/**
 * BiaBrain: The "brain" of the AI assistant that processes WhatsApp commands.
 * It listens for new messages in Supabase and uses Gemini to interpret them.
 */
export const BiaBrain: React.FC = () => {
  const store = useStore();

  useEffect(() => {
    // 1. Listen for new messages in the 'whatsapp_commands' table
    console.log('BiaBrain: Starting to listen for WhatsApp commands via Supabase Realtime...');
    
    const channel = supabase
      .channel('whatsapp-commands')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_commands' },
        (payload) => {
          const newCommand = payload.new;
          console.log('BiaBrain: New command received from Supabase:', newCommand);
          
          if (!newCommand.processed) {
            toast.success(`Bia recebeu um comando: "${newCommand.message_text.substring(0, 20)}..."`, {
              icon: '🤖',
              duration: 4000
            });
            processCommand(newCommand);
          } else {
            console.log('BiaBrain: Command already processed, skipping.');
          }
        }
      )
      .subscribe((status) => {
        console.log(`BiaBrain: Realtime subscription status: ${status}`);
      });

    return () => {
      console.log('BiaBrain: Cleaning up Realtime subscription.');
      supabase.removeChannel(channel);
    };
  }, []);

  const processCommand = async (command: any) => {
    const { id, message_text, sender_name, sender_number } = command;
    
    console.log(`Bia received message: "${message_text}" from ${sender_name} (${sender_number})`);

    // Check if message is for Bia (starts with Bia or contains Bia)
    const isTriggered = message_text.toLowerCase().includes('bia');
    
    if (!isTriggered) {
      // If not triggered, just mark as processed but with no action
      await supabase.from('whatsapp_commands').update({ processed: true, action_taken: 'IGNORED' }).eq('id', id);
      return;
    }

    // Remove the "Bia, " or "Bia " prefix for the AI
    const cleanMessage = message_text.replace(/bia/gi, '').trim();

    console.log(`Bia is thinking about: "${cleanMessage}"`);

    // Send an initial "thinking" message to show Bia is working
    await sendWhatsAppMessage(sender_number, "Recebi seu comando! Deixa eu processar aqui rapidinho... ⏳");

    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && (import.meta.env as any).VITE_GEMINI_API_KEY);
      
      if (!apiKey) {
        console.error('Bia Error: GEMINI_API_KEY is not defined in process.env or import.meta.env');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Define the schema for the AI response
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: "The action to perform: 'ADD_CLIENT', 'ADD_PACKAGE', 'ADD_VISITOR', 'ADD_MOVE', 'ADD_TICKET', 'ADD_QUOTE', 'ADD_FINANCIAL', 'GET_SUMMARY', 'UNKNOWN'",
          },
          data: {
            type: Type.OBJECT,
            description: "The data extracted from the message to perform the action",
          },
          reply: {
            type: Type.STRING,
            description: "A friendly reply to send back to the user via WhatsApp",
          }
        },
        required: ["action", "data", "reply"]
      };

      const prompt = `
        Você é a Bia, a assistente virtual inteligente do sistema de gestão condominial IAC TEC.
        Sua tarefa é interpretar comandos de voz ou texto vindos do WhatsApp e transformá-los em ações no sistema.

        Comando do usuário: "${cleanMessage}"
        Remetente: ${sender_name}

        Ações possíveis:
        1. ADD_CLIENT: Cadastrar morador. Campos: name, phone, tower, unit, address.
        2. ADD_PACKAGE: Registrar encomenda. Campos: residentName, apartment, tower, carrier, trackingCode.
        3. ADD_VISITOR: Registrar visitante. Campos: name, document, type (VISITOR/SERVICE_PROVIDER), apartment, tower.
        4. ADD_MOVE: Agendar mudança. Campos: type (IN/OUT), date (ISO string), notes, unit, tower.
        5. ADD_TICKET: Abrir Ordem de Serviço (OS) ou Chamado. Campos: title, type (PREVENTIVA/CORRETIVA/TAREFA), observations, location, reportedBy, apartment, tower.
        6. ADD_QUOTE: Realizar orçamento. Campos: apartment, tower, items (array de {description, quantity, unitPrice}).
        7. ADD_FINANCIAL: Lançamento financeiro. Campos: description, amount, type (INCOME/EXPENSE), category, date.
        8. GET_SUMMARY: Obter resumo ou saldo. Campos: topic ('financeiro', 'chamados', 'moradores', 'agenda').
        9. UNKNOWN: Se não entender o comando.

        Exemplos de entrada e saída:
        - "chegou uma encomenda da Amazon para o apto 101 torre A" -> { "action": "ADD_PACKAGE", "data": { "carrier": "Amazon", "apartment": "101", "tower": "A" }, "reply": "Recebido! Registrei a encomenda da Amazon para o apto 101A." }
        - "Bia, qual o nosso saldo?" -> { "action": "GET_SUMMARY", "data": { "topic": "financeiro" }, "reply": "Vou verificar o saldo para você agora mesmo." }
        - "cadastra o morador João no apto 202 torre B, tel 21999999999" -> { "action": "ADD_CLIENT", "data": { "name": "João", "unit": "202", "tower": "B", "phone": "21999999999" }, "reply": "Com certeza! O morador João foi cadastrado no apto 202B." }
        - "abrir chamado de vazamento na pia do apto 303 torre C" -> { "action": "ADD_TICKET", "data": { "title": "Vazamento na pia", "type": "CORRETIVA", "observations": "Vazamento na pia da cozinha", "apartment": "303", "tower": "C", "location": "Cozinha" }, "reply": "Ok! Abri o chamado de vazamento para o apto 303C." }
        - "fazer orçamento de pintura para o apto 404 torre D, valor 500 reais" -> { "action": "ADD_QUOTE", "data": { "apartment": "404", "tower": "D", "items": [{ "description": "Pintura", "quantity": 1, "unitPrice": 500 }] }, "reply": "Feito! Gere o orçamento de pintura para o apto 404D." }
        - "pagamento de 1500 reais para limpeza hoje" -> { "action": "ADD_FINANCIAL", "data": { "description": "Limpeza", "amount": 1500, "type": "EXPENSE", "category": "Serviços", "date": "2026-03-23" }, "reply": "Registrado! Lançamento de R$ 1.500,00 para limpeza realizado." }

        Responda APENAS em formato JSON seguindo o schema fornecido.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (!result.action) throw new Error('Invalid AI response');
      
      console.log('Bia interpreted:', result);

      // Execute the action
      let success = false;
      
      const findResident = (apartment?: string, tower?: string) => {
        if (!apartment) return null;
        return store.clients.find(c => {
          const unitMatch = c.unit === apartment || c.address.includes(apartment);
          const towerMatch = !tower || c.tower === tower || c.address.includes(tower);
          return unitMatch && towerMatch;
        });
      };

      switch (result.action) {
        case 'ADD_CLIENT':
          await store.addClient(result.data);
          success = true;
          break;
        case 'ADD_PACKAGE':
          const pkgResident = findResident(result.data.apartment, result.data.tower);
          await store.addPackage({ 
            ...result.data, 
            clientId: pkgResident?.id,
            residentName: result.data.residentName || pkgResident?.name || 'Morador'
          });
          success = true;
          break;
        case 'ADD_VISITOR':
          const visitorResident = findResident(result.data.apartment, result.data.tower);
          await store.addVisitor({ 
            ...result.data, 
            clientId: visitorResident?.id,
            validUntil: new Date(Date.now() + 86400000).toISOString() 
          });
          success = true;
          break;
        case 'ADD_MOVE':
          const moveResident = findResident(result.data.unit, result.data.tower);
          if (moveResident) {
            await store.addMove({ 
              ...result.data, 
              clientId: moveResident.id, 
              status: 'PENDING' 
            });
            success = true;
          } else {
            result.reply = "Não encontrei o morador para agendar essa mudança. Pode me dizer o nome ou unidade?";
          }
          break;
        case 'ADD_TICKET':
          const ticketResident = findResident(result.data.apartment, result.data.tower);
          await store.addTicket({
            title: result.data.title || 'Chamado via WhatsApp',
            type: result.data.type || 'CORRETIVA',
            status: 'PENDENTE_APROVACAO',
            observations: result.data.observations,
            location: result.data.location || `Apto ${result.data.apartment}${result.data.tower || ''}`,
            reportedBy: result.data.reportedBy || sender_name,
            clientId: ticketResident?.id,
            date: new Date().toISOString(),
            technician: 'Não atribuído'
          });
          success = true;
          break;
        case 'ADD_QUOTE':
          const quoteResident = findResident(result.data.apartment, result.data.tower);
          if (quoteResident) {
            const totalValue = result.data.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0) || 0;
            await store.addQuote({
              clientId: quoteResident.id,
              date: new Date().toISOString(),
              totalValue,
              status: 'DRAFT',
              items: result.data.items?.map((item: any, index: number) => ({
                id: (index + 1).toString(),
                ...item,
                total: item.quantity * item.unitPrice
              })) || []
            });
            success = true;
          } else {
            result.reply = "Não encontrei o morador para gerar este orçamento. Pode confirmar a unidade?";
          }
          break;
        case 'ADD_FINANCIAL':
          if (result.data.type === 'INCOME') {
            await store.addReceipt({
              description: result.data.description,
              value: result.data.amount,
              date: result.data.date || new Date().toISOString().split('T')[0],
              clientId: findResident(result.data.apartment, result.data.tower)?.id
            });
          } else {
            await store.addCost({
              description: result.data.description,
              value: result.data.amount,
              date: result.data.date || new Date().toISOString().split('T')[0],
              category: result.data.category || 'Geral'
            });
          }
          success = true;
          break;
        case 'GET_SUMMARY':
          const topic = result.data.topic || 'financeiro';
          let summary = '';
          
          if (topic === 'financeiro') {
            const totalReceitas = store.receipts.reduce((acc, r) => acc + r.value, 0);
            const totalDespesas = store.costs.reduce((acc, c) => acc + c.value, 0);
            summary = `Resumo Financeiro: Receitas totais de R$ ${totalReceitas.toFixed(2)} e despesas totais de R$ ${totalDespesas.toFixed(2)}. Saldo atual: R$ ${(totalReceitas - totalDespesas).toFixed(2)}.`;
          } else if (topic === 'chamados') {
            const total = store.tickets.length;
            const concluidos = store.tickets.filter(t => t.status === 'CONCLUIDO').length;
            summary = `Resumo de Chamados: Temos ${total} chamados no total, sendo ${concluidos} já concluídos.`;
          } else if (topic === 'moradores') {
            summary = `Temos ${store.clients.length} moradores cadastrados no sistema.`;
          } else if (topic === 'agenda') {
            summary = `Você tem ${store.appointments.length} compromissos registrados na agenda.`;
          }
          
          result.reply = summary || result.reply;
          success = true;
          break;
        default:
          console.log('Unknown action:', result.action);
      }

      // Mark as processed in Supabase
      await supabase
        .from('whatsapp_commands')
        .update({ processed: true, action_taken: result.action })
        .eq('id', id);

      // Send reply back via WhatsApp
      if (result.reply) {
        await sendWhatsAppMessage(sender_number, result.reply);
      }

      if (success) {
        toast.success(`Bia executou: ${result.action}`);
      }

    } catch (error) {
      console.error('Bia failed to process command:', error);
      await sendWhatsAppMessage(sender_number, "Desculpe, tive um probleminha técnico ao processar seu comando. Pode tentar de novo?");
    }
  };

  return null; // This component doesn't render anything
};
