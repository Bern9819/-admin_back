const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000; // ✅ Usa la porta di Render o locale

app.use(cors());
app.use(bodyParser.json());

const collaboratorsFile = 'collaborators.json';
const eventsFile = 'events.json';
const users = [{ username: 'admin', password: 'password123' }]; // Login semplice

// Funzione per leggere i file JSON
function readJsonFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch (err) {
    console.error(`Errore lettura ${file}:`, err.message);
    return [];
  }
}

// Funzione per scrivere i file JSON
function writeJsonFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Login semplice
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, message: 'Login riuscito' });
  } else {
    res.status(401).json({ success: false, message: 'Credenziali errate' });
  }
});

// API per collaboratori
app.get('/collaborators', (req, res) => {
  res.json(readJsonFile(collaboratorsFile));
});

app.post('/collaborators', (req, res) => {
  const { name, calendarType, calendarUrl } = req.body;
  if (!name || !calendarType || !calendarUrl) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori!' });
  }
  const collaborators = readJsonFile(collaboratorsFile);
  const newCollaborator = { id: Date.now(), name, calendarType, calendarUrl };
  collaborators.push(newCollaborator);
  writeJsonFile(collaboratorsFile, collaborators);
  res.status(201).json(newCollaborator);
});

app.delete('/collaborators/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let collaborators = readJsonFile(collaboratorsFile);
  collaborators = collaborators.filter(c => c.id !== id);
  writeJsonFile(collaboratorsFile, collaborators);
  res.json({ message: 'Collaboratore rimosso' });
});

// API per eventi
app.get('/events', (req, res) => {
  res.json(readJsonFile(eventsFile));
});

app.post('/events', (req, res) => {
  const { name, type, location } = req.body;
  if (!name || !type || !location) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori!' });
  }
  const events = readJsonFile(eventsFile);
  const newEvent = { id: Date.now(), name, type, location };
  events.push(newEvent);
  writeJsonFile(eventsFile, events);
  res.status(201).json(newEvent);
});

app.delete('/events/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let events = readJsonFile(eventsFile);
  events = events.filter(e => e.id !== id);
  writeJsonFile(eventsFile, events);
  res.json({ message: 'Evento rimosso' });
});

// Default route (opzionale)
app.get('/', (req, res) => {
  res.send('✅ Agencee Backend API attivo');
});

const axios = require('axios');
const ical = require('ical');

// Funzione per scaricare e leggere i calendari dei collaboratori
async function fetchCalendar(url) {
  try {
    const httpsUrl = url.replace('webcal://', 'https://'); // se serve
    console.log(`📥 Scaricamento calendario: ${httpsUrl}`);

    const response = await axios.get(httpsUrl);
    const data = ical.parseICS(response.data);

    const events = Object.values(data).filter(event => event.type === 'VEVENT');
    console.log(`✅ Eventi trovati nel calendario: ${events.length}`);
    
    return events;
  } catch (error) {
    console.error('❌ Errore fetch calendario:', error.message);
    return [];
  }
}

// Endpoint per verificare la disponibilità dei collaboratori
app.get('/availability', async (req, res) => {
  const { date, time } = req.query;

  if (!date || !time) {
    return res.status(400).json({ error: 'Parametri "date" e "time" obbligatori!' });
  }

  const requestedDateTime = new Date(`${date}T${time}:00`);
  const slotDurationMinutes = 30;
  const slotEndTime = new Date(requestedDateTime.getTime() + slotDurationMinutes * 60000);

  const collaborators = readJsonFile(collaboratorsFile);
  const availableCollaborators = [];

  // Ciclo su tutti i collaboratori
  for (const collaborator of collaborators) {
    const events = await fetchCalendar(collaborator.calendarUrl);

    // Verifica se è libero
    const isBusy = events.some(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);

      return (
        (requestedDateTime >= start && requestedDateTime < end) ||
        (slotEndTime > start && slotEndTime <= end)
      );
    });

    if (!isBusy) {
      availableCollaborators.push(collaborator.name);
    }
  }

  console.log(`🔎 Disponibilità per ${date} ${time}:`, availableCollaborators);

  res.json({
    date,
    time,
    availableCollaborators
  });
});

app.listen(port, () => {
  console.log(`✅ Admin Panel Backend attivo su http://localhost:${port}`);
});
