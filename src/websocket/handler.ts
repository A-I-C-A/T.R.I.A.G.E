import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/auth';
import logger from '../utils/logger';

export class WebSocketHandler {
  private io: SocketServer;
  private hospitalRooms: Map<number, Set<string>> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const user = verifyToken(token);
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      logger.info(`User connected: ${user.email} (${user.role})`);

      socket.on('join:hospital', (hospitalId: number) => {
        if (user.role === 'government' || user.hospitalId === hospitalId) {
          socket.join(`hospital:${hospitalId}`);
          
          if (!this.hospitalRooms.has(hospitalId)) {
            this.hospitalRooms.set(hospitalId, new Set());
          }
          this.hospitalRooms.get(hospitalId)!.add(socket.id);

          logger.info(`User ${user.email} joined hospital:${hospitalId}`);
        }
      });

      socket.on('join:government', () => {
        if (user.role === 'government') {
          socket.join('government');
          logger.info(`Government user ${user.email} joined government dashboard`);
        }
      });

      socket.on('disconnect', () => {
        this.hospitalRooms.forEach((sockets, hospitalId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.hospitalRooms.delete(hospitalId);
          }
        });
        logger.info(`User disconnected: ${user.email}`);
      });
    });
  }

  public emitQueueUpdate(hospitalId: number, queueData: any) {
    this.io.to(`hospital:${hospitalId}`).emit('queue:update', queueData);
  }

  public emitPatientRegistered(hospitalId: number, patientData: any) {
    this.io.to(`hospital:${hospitalId}`).emit('patient:registered', patientData);
  }

  public emitPatientEscalated(hospitalId: number, escalationData: any) {
    this.io.to(`hospital:${hospitalId}`).emit('patient:escalated', escalationData);
    this.io.to('government').emit('escalation:alert', {
      hospitalId,
      ...escalationData
    });
  }

  public emitStatusUpdate(hospitalId: number, statusData: any) {
    this.io.to(`hospital:${hospitalId}`).emit('patient:status', statusData);
  }

  public emitAlert(hospitalId: number, alertData: any) {
    this.io.to(`hospital:${hospitalId}`).emit('alert:new', alertData);
    
    if (alertData.severity === 'critical') {
      this.io.to('government').emit('alert:critical', {
        hospitalId,
        ...alertData
      });
    }
  }

  public emitHospitalStats(hospitalId: number, stats: any) {
    this.io.to(`hospital:${hospitalId}`).emit('hospital:stats', stats);
    this.io.to('government').emit('hospital:stats:update', {
      hospitalId,
      stats
    });
  }

  public emitCrowdSurge(surgeData: any) {
    this.io.to('government').emit('crowd:surge', surgeData);
  }

  public getIO(): SocketServer {
    return this.io;
  }
}

export let websocketHandler: WebSocketHandler;

export const initializeWebSocket = (server: HttpServer): WebSocketHandler => {
  websocketHandler = new WebSocketHandler(server);
  return websocketHandler;
};
