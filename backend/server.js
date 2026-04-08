require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const si = require('systeminformation');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const minecraftRoutes = require('./routes/minecraft');
const processRoutes = require('./routes/processes');
const actionsRoutes = require('./routes/actions');
const agentsRoutes = require('./routes/agents');
const logsRoutes = require('./routes/logs');
const novamindRoutes = require('./routes/novamind');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', minecraftRoutes);
app.use('/api', processRoutes);
app.use('/api', actionsRoutes);
app.use('/api', agentsRoutes);
app.use('/api', logsRoutes);
app.use('/api', novamindRoutes);

// Root check
app.get('/', (req, res) => {
  res.json({ status: 'NovaDash backend online' });
});

// Socket.io — push live stats every 3 seconds
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const interval = setInterval(async () => {
    const [cpu, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize()
    ]);

    socket.emit('stats', {
      cpu: cpu.currentLoad.toFixed(1),
      memUsed: (mem.used / 1024 ** 3).toFixed(2),
      memTotal: (mem.total / 1024 ** 3).toFixed(2),
      disk: disk[0] ? {
        used: (disk[0].used / 1024 ** 3).toFixed(1),
        size: (disk[0].size / 1024 ** 3).toFixed(1),
        percent: disk[0].use.toFixed(1)
      } : null
    });
  }, 3000);

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`NovaDash backend running on port ${PORT}`);
});
