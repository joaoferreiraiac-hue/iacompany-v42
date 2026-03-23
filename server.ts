import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

    // Webhook for Evolution API
    app.post('/api/webhook/whatsapp', async (req, res) => {
      try {
        const data = req.body;
        const event = data.event?.toLowerCase();
        
        console.log(`--- WhatsApp Webhook Received: ${event} ---`);

        // Evolution API sends message data in different formats depending on the event
        if (event === 'messages.upsert' || event === 'messages_upsert') {
          // Handle both single object and array of messages
          const messages = Array.isArray(data.data) ? data.data : [data.data];
          
          for (const msg of messages) {
            // Skip if no message content
            if (!msg) continue;

            // Evolution API message structure can vary
            const message = msg.message || msg;
            const remoteJid = msg.key?.remoteJid || msg.remoteJid;
            const pushName = msg.pushName || 'Desconhecido';
            const fromMe = msg.key?.fromMe || false;
            
            // Get text content from various message types
            const text = message.conversation || 
                         message.extendedTextMessage?.text || 
                         message.imageMessage?.caption || 
                         message.buttonsResponseMessage?.selectedButtonId ||
                         message.listResponseMessage?.title ||
                         '';

            // Loop prevention: skip if message contains the hidden bot character (\u200B)
            if (text.includes('\u200B')) {
              console.log('Skipping message sent by the bot (hidden character detected).');
              continue;
            }

            // Skip messages sent by the user to themselves if they don't mention Bia
            if (fromMe && !text.toLowerCase().includes('bia')) {
              console.log('Skipping message sent by the user to themselves (no Bia mention).');
              continue;
            }

            if (text) {
              console.log(`Processing message from ${pushName} (${remoteJid}): "${text}"`);
              
              // Insert into a table for the frontend to process
              const { error } = await supabase.from('whatsapp_commands').insert([{
                sender_name: pushName,
                sender_number: remoteJid,
                message_text: text,
                processed: false,
                created_at: new Date().toISOString()
              }]);

              if (error) {
                console.error('Error inserting command into Supabase:', error);
              } else {
                console.log('Command inserted successfully into Supabase for BiaBrain to process.');
              }
            }
          }
        }

        res.status(200).send('OK');
      } catch (error) {
        console.error('Critical error in WhatsApp webhook handler:', error);
        res.status(500).send('Internal Server Error');
      }
    });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Webhook URL for Evolution API: ${appUrl}/api/webhook/whatsapp`);
  });
}

startServer();
