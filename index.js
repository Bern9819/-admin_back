const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

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

app.listen(port, () => {
  console.log(`✅ Admin Panel Backend attivo su http://localhost:${port}`);
});
