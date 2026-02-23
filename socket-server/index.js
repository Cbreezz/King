const { createServer } = require('http');
const { Server } = require('socket.io');

console.log('[Socket.IO] Starting standalone server...');

// Track server state
let isServerReady = false;
let coldStartTime = Date.now();
let serverStats = {
  connections: 0,
  rooms: 0,
  uptime: 0,
  coldStartDuration: 0
};

// Create a standalone HTTP server
const httpServer = createServer((req, res) => {
  // Enhanced health check endpoint
  const status = {
    status: isServerReady ? 'ready' : 'starting',
    message: isServerReady 
      ? 'Socket.IO server is running' 
      : 'Socket.IO server is warming up',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: io?.engine?.clientsCount || 0,
    coldStart: !isServerReady,
    coldStartTime: Date.now() - coldStartTime,
    stats: {
      ...serverStats,
      currentRooms: rooms?.size || 0,
      currentConnections: io?.engine?.clientsCount || 0
    }
  };

  // Set CORS headers
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  
  res.end(JSON.stringify(status));
});

// Initialize Socket.IO with the standalone server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://king-self-two.vercel.app',
          'https://king-w38u.onrender.com'
        ]
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  // Aggressive timeouts for free tier
  pingTimeout: 30000,      // 30s ping timeout
  pingInterval: 15000,     // 15s ping interval
  connectTimeout: 20000,   // 20s connect timeout
  // Enable adaptable backoff 
  reconnectionDelay: 1000,    // Start with 1s delay
  reconnectionDelayMax: 10000, // Max 10s delay
  maxRetries: 10,             // Increased retries for cold starts
  path: '/socket.io/'         // Ensure the path is explicitly set
});

// Cold start handling
io.use(async (socket, next) => {
  try {
    // Track connection in stats
    serverStats.connections++;
    
    // If this is first connection during cold start
    if (!isServerReady) {
      const startupTime = Date.now() - coldStartTime;
      console.log(`[Socket.IO] Cold start completed in ${startupTime}ms`);
      serverStats.coldStartDuration = startupTime;
      isServerReady = true;
      
      // Emit server ready event
      io.emit('server_ready', { 
        startupTime,
        connections: io.engine.clientsCount,
        timestamp: new Date().toISOString()
      });
    }
    
    // Add connection timestamp
    socket.connectTime = Date.now();
    
    // Check if this is a reconnection
    const attemptCount = socket.handshake.auth?.attemptCount || 0;
    if (attemptCount > 0) {
      console.log(`[Socket.IO] Client reconnection attempt ${attemptCount} for ${socket.id}`);
    }
    
    next();
  } catch (error) {
    console.error('[Socket.IO] Error in connection middleware:', error);
    next(error);
  }
});

// Update server stats periodically
setInterval(() => {
  serverStats = {
    ...serverStats,
    uptime: process.uptime(),
    rooms: rooms.size,
    connections: io.engine.clientsCount
  };
}, 5000);

// Set up global error handlers
process.on('uncaughtException', (error) => {
  console.error('[Socket.IO] CRITICAL: Uncaught exception:', error);
  // Log error but don't exit - trying to keep the server alive
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Socket.IO] CRITICAL: Unhandled rejection at:', promise, 'reason:', reason);
  // Log error but don't exit - trying to keep the server alive
});

// Handle graceful shutdown
function gracefulShutdown() {
  console.log('[Socket.IO] Shutting down gracefully...');
  // Close all connections
  io.close(() => {
    console.log('[Socket.IO] All connections closed');
    httpServer.close(() => {
      console.log('[Socket.IO] HTTP server closed');
      process.exit(0);
    });
  });
  
  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('[Socket.IO] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Store rooms and user data
const rooms = new Map();
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId

// Set up connection handling
io.on('connection', (socket) => {
  const connTime = Date.now() - socket.handshake.time;
  console.log(`[Socket.IO] Client connected in ${connTime}ms, id: ${socket.id}`);

  console.log('[Socket.IO] Client connected:', socket.id);

  // Authenticate socket
  const auth = socket.handshake.auth;
  if (!auth?.token) {
    console.log('[Socket.IO] No auth token provided');
    socket.disconnect();
    return;
  }

  const userId = auth.token;
  console.log(`[Socket.IO] User authenticated: ${userId}`);
  
  // Store user information if provided in the auth
  socket.data = socket.data || {};
  if (auth.userData) {
    socket.data.user = auth.userData;
    console.log(`[Socket.IO] User data received during auth for ${socket.id}:`, socket.data.user);
  } else {
    // Create minimal user data if not provided
    socket.data.user = {
      id: userId,
      name: `User ${userId.slice(0, 8)}`,
      role: 'USER'
    };
    console.log(`[Socket.IO] Created minimal user data for ${socket.id}:`, socket.data.user);
  }
  
  userSockets.set(userId, socket.id);
  socketUsers.set(socket.id, userId);// Handle room joining
  socket.on('join_room', (roomId) => {
    if (!roomId) return;
    
    socket.join(roomId);
    console.log(`[Socket.IO] User ${socket.id} (${userId}) joined room ${roomId}`);
    
    // Track room membership
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(userId);
    
    // Log room membership
    const roomMembers = Array.from(rooms.get(roomId));
    console.log(`[Socket.IO] Room ${roomId} now has ${roomMembers.length} members: ${roomMembers.join(', ')}`);
    
    // Send room joined confirmation to the user with message history
    // In a real implementation, you would fetch message history from database here
    // For now, we'll let the frontend handle loading message history via API
    socket.emit('room_joined', { 
      roomId,
      messages: [] // Frontend will load history via API call
    });
    
    // Get user information from authentication data
    const userInfo = {
      id: userId,
      socketId: socket.id,
      role: socket.data?.user?.role || 'USER'
    };
    
    // Notify room about new user with user information
    io.to(roomId).emit('user_joined', { 
      user: userInfo, 
      roomId,
      timestamp: new Date().toISOString(),
      message: `${userInfo.role === 'DJ' ? 'DJ' : 'User'} has joined the chat`
    });
    
    // Update online users list for everyone in the room
    updateOnlineUsers(roomId);
  });
    // When a user joins a room, send a message to all clients in the room with the new user count
  socket.on('get_room_status', (roomId) => {
    if (!roomId) return;
    
    if (rooms.has(roomId)) {
      const userCount = rooms.get(roomId).size;
      io.to(roomId).emit('user_count', userCount);
      updateOnlineUsers(roomId);
    }
  });
  
  // Let clients request a resync of messages and user list
  socket.on('resync_room', (roomId) => {
    if (!roomId) return;
    
    // Update online users
    updateOnlineUsers(roomId);
    
    // Send user count
    if (rooms.has(roomId)) {
      const userCount = rooms.get(roomId).size;
      io.to(roomId).emit('user_count', userCount);
    }
    
    // Notify client that resync is complete
    socket.emit('room_resynced', { roomId, timestamp: new Date().toISOString() });
  });  // Handle chat messages
  socket.on('send_message', (data, callback) => {
    const { roomId, message, senderId, senderName, senderRole, senderImage, format, messageId, timestamp } = data;
    
    if (!roomId || !message) {
      if (callback) callback({ error: 'Invalid message data' });
      return;
    }
    
    // Create a proper sender object from the individual fields
    const sender = {
      id: senderId || userId,
      name: senderName || socket.data?.user?.name || `User ${userId.slice(0, 8)}`,
      role: senderRole || socket.data?.user?.role || 'USER',
      image: senderImage || socket.data?.user?.image
    };
    
    // Validate sender data
    if (!sender.id || sender.id === 'undefined' || sender.id === 'null') {
      console.error(`[Socket.IO] Invalid sender ID for message in room ${roomId}:`, data);
      sender.id = userId; // Fallback to socket user ID
    }
    
    if (!sender.name || sender.name === 'undefined' || sender.name === 'null') {
      console.error(`[Socket.IO] Invalid sender name for message in room ${roomId}:`, data);
      sender.name = socket.data?.user?.name || `User ${userId.slice(0, 8)}`;
    }
    
    console.log(`[Socket.IO] Message in room ${roomId} from ${sender.name} (${sender.id}): ${message.substring(0, 50)}`);
    console.log(`[Socket.IO] Full sender object:`, sender);
    
    // Use the provided messageId from database or create a fallback ID
    const finalMessageId = messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ensure the message is broadcast to ALL clients in the room
    const messageData = {
      id: finalMessageId,
      message,
      sender,
      format,
      timestamp: timestamp || new Date().toISOString()
    };
    
    console.log(`[Socket.IO] Broadcasting message data:`, messageData);
    
    try {
      // Broadcast to all sockets in the room
      io.in(roomId).emit('new_message', messageData);
      
      // Log message delivery
      const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      console.log(`[Socket.IO] Broadcasted message to ${roomSize} clients in room ${roomId}`);
      
      // Acknowledge message receipt
      if (callback) callback({ success: true, messageId: finalMessageId });
    } catch (error) {
      console.error(`[Socket.IO] Error broadcasting message to room ${roomId}:`, error);
      if (callback) callback({ error: 'Failed to broadcast message' });
    }
  });

  // Handle stream reactions (likes/comments) for live sessions
  socket.on('stream:like', ({ djId }) => {
    if (!djId) return;
    console.log(`[Socket.IO] Stream like for DJ ${djId} from user ${userId}`);
    io.emit(`stream:${djId}:like`);
  });

  socket.on('stream:comment', ({ djId, comment }) => {
    if (!djId || !comment) return;
    console.log(`[Socket.IO] Stream comment for DJ ${djId} from user ${userId}:`, comment.text);
    io.emit(`stream:${djId}:comment`, comment);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const roomId = data.roomId;
    if (!roomId) return;

    // Get full user data
    const userData = socket.data?.user || { 
      id: userId,
      name: `User ${userId.slice(0, 8)}`
    };

    socket.to(roomId).emit('user_typing', { 
      userId: userData.id,
      socketId: socket.id,
      userName: userData.name,
      userRole: userData.role,
      image: userData.image
    });
  });

  socket.on('typing_end', (roomId) => {
    if (!roomId) return;
    const userData = socket.data?.user || { id: userId };
    socket.to(roomId).emit('user_stopped_typing', { 
      userId: userData.id,
      socketId: socket.id 
    });
  });
  
  // Handle reactions on messages
  socket.on('add_reaction', (data) => {
    const { roomId, messageId, emoji, userId: reactingUserId } = data || {};
    if (!roomId || !messageId || !emoji || !reactingUserId) return;

    console.log(
      `[Socket.IO] Reaction added in room ${roomId} on message ${messageId} by ${reactingUserId}: ${emoji}`
    );

    io.to(roomId).emit('reaction_added', {
      messageId,
      emoji,
      userId: reactingUserId,
    });
  });

  socket.on('remove_reaction', (data) => {
    const { roomId, messageId, emoji, userId: reactingUserId } = data || {};
    if (!roomId || !messageId || !emoji || !reactingUserId) return;

    console.log(
      `[Socket.IO] Reaction removed in room ${roomId} on message ${messageId} by ${reactingUserId}: ${emoji}`
    );

    io.to(roomId).emit('reaction_removed', {
      messageId,
      emoji,
      userId: reactingUserId,
    });
  });

  // Handle user leaving
  socket.on('leave_room', (roomId) => {
    if (!roomId) return;
    
    handleLeaveRoom(socket, roomId, userId);
  });
  
  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.id} (${userId})`);
    
    // Clean up all rooms this user was in
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(userId)) {
        handleLeaveRoom(socket, roomId, userId);
      }
    }
    
    // Clean up user mappings
    userSockets.delete(userId);
    socketUsers.delete(socket.id);
  });
  
  // Store user information on the socket
  socket.on('set_user_data', (userData) => {
    if (!userData) return;
    
    // Store user data on the socket
    socket.data = socket.data || {};
    socket.data.user = {
      ...socket.data.user,
      ...userData
    };
    
    console.log(`[Socket.IO] User data set for ${socket.id} (${userId}):`, socket.data.user);
    
    // Update online users in all rooms this user is in
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(userId)) {
        updateOnlineUsers(roomId);
      }
    }
  });
  
  // Handle DJ activity indicators
  socket.on('dj_live', async (data) => {
    const { roomId, isLive, djId, djName } = data;
    if (!roomId) return;
    
    const actualDjId = djId || userId;
    const actualDjName = djName || socket.data?.user?.name;
    
    console.log(`[Socket.IO] ====== DJ LIVE STATUS CHANGE ======`);
    console.log(`[Socket.IO] DJ ID: ${actualDjId}`);
    console.log(`[Socket.IO] DJ Name: ${actualDjName}`);
    console.log(`[Socket.IO] Room ID: ${roomId}`);
    console.log(`[Socket.IO] Is Live: ${isLive}`);
    console.log(`[Socket.IO] Total connected clients: ${io.sockets.sockets.size}`);
    
    // Broadcast DJ status to ALL clients
    const statusUpdate = {
      djId: actualDjId,
      djName: actualDjName,
      roomId,
      isLive,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Socket.IO] Broadcasting to all clients:`, statusUpdate);
    io.emit('dj_status_update', statusUpdate);
    
    // Send follower-specific notifications if DJ goes live
    if (isLive) {
      console.log(`[Socket.IO] DJ going live - sending follower notifications`);
      
      // Find all connected users who are followers of this DJ
      const followerNotifications = [];
      for (const [socketId, connectedSocket] of io.sockets.sockets) {
        const userData = connectedSocket.data?.user;
        if (userData && userData.role === 'USER') {
          // Send follower-specific event (we'll check following status on client side)
          connectedSocket.emit('dj_live_notification', {
            djId: actualDjId,
            djName: actualDjName,
            roomId,
            message: `${actualDjName} is now live!`,
            timestamp: new Date().toISOString()
          });
          followerNotifications.push(userData.id);
        }
      }
      
      console.log(`[Socket.IO] Sent follower notifications to ${followerNotifications.length} users`);
    }
    
    console.log(`[Socket.IO] =====================================`);
  });
  
  // Debug endpoint to check room state
  socket.on('debug_room', (roomId) => {
    if (!roomId) return;
    
    // Only allow this for admins and DJs
    if (socket.data?.user?.role !== 'DJ' && socket.data?.user?.role !== 'ADMIN') {
      socket.emit('error', { message: 'Unauthorized to debug room' });
      return;
    }
    
    try {
      const roomInfo = {
        roomId,
        userCount: rooms.has(roomId) ? rooms.get(roomId).size : 0,
        users: rooms.has(roomId) ? Array.from(rooms.get(roomId)).map(uid => {
          const sid = userSockets.get(uid);
          const s = io.sockets.sockets.get(sid);
          return {
            id: uid,
            name: s?.data?.user?.name || `User ${uid.slice(0, 8)}`,
            role: s?.data?.user?.role || 'USER',
            connected: !!s?.connected,
          };
        }) : [],
        socketCount: io.sockets.adapter.rooms.get(roomId)?.size || 0,
      };
      
      socket.emit('debug_room_info', roomInfo);
      console.log(`[Socket.IO] Debug info sent for room ${roomId}:`, roomInfo);
    } catch (error) {
      console.error(`[Socket.IO] Error getting debug info for room ${roomId}:`, error);
      socket.emit('error', { message: 'Error retrieving room debug info' });
    }
  });
  
  // Handle heartbeat for keeping connection alive
  socket.on('heartbeat', () => {
    console.log(`[Socket.IO] Heartbeat received from ${socket.id} (${userId})`);
    socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
  });
  
  // Handle reconnection
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`[Socket.IO] Reconnection attempt ${attemptNumber} for ${socket.id}`);
  });

  socket.on('reconnect', () => {
    console.log(`[Socket.IO] Socket reconnected: ${socket.id} (${userId})`);
    
    // Re-join all rooms after reconnection
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(userId)) {
        socket.join(roomId);
        console.log(`[Socket.IO] Rejoined room ${roomId} after reconnection`);
        
        // Update room state
        updateOnlineUsers(roomId);
        
        // Notify user that reconnection was successful
        socket.emit('reconnection_success', { 
          roomId, 
          timestamp: new Date().toISOString() 
        });
      }
    }
  });
});

// Helper function for leave room logic
function handleLeaveRoom(socket, roomId, userId) {
  socket.leave(roomId);
  console.log(`[Socket.IO] User ${socket.id} (${userId}) left room ${roomId}`);
  
  // Update room tracking
  if (rooms.has(roomId)) {
    // Get user info before removing them
    const socketId = userSockets.get(userId);
    const leavingSocket = io.sockets.sockets.get(socketId);
    const userName = leavingSocket?.data?.user?.name || `User ${userId.slice(0, 8)}`;
    const userRole = leavingSocket?.data?.user?.role || 'USER';
    
    rooms.get(roomId).delete(userId);
    
    // If room is empty, remove it
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
      console.log(`[Socket.IO] Room ${roomId} is now empty and has been removed`);
    } else {
      // Notify room about user leaving with more details
      io.to(roomId).emit('user_left', { 
        userId, 
        userName,
        userRole,
        roomId,
        timestamp: new Date().toISOString()
      });
      
      // Update online users list
      updateOnlineUsers(roomId);
    }
  }
}

// Helper function to update online users list for a room
function updateOnlineUsers(roomId) {
  if (!rooms.has(roomId)) return;
  
  // Get all user IDs in the room
  const userIds = Array.from(rooms.get(roomId));
  
  // Get user information for each user
  const onlineUsers = userIds.map(userId => {
    const socketId = userSockets.get(userId);
    const socket = io.sockets.sockets.get(socketId);
    
    return {
      id: userId,
      name: socket?.data?.user?.name || `User ${userId.slice(0, 8)}`,
      role: socket?.data?.user?.role || 'USER',
    };
  });
  
  // Send updated online users list to everyone in the room
  io.to(roomId).emit('online_users', onlineUsers);
}

// Get the port from environment or use 3001 as fallback
const PORT = process.env.PORT || 4000;

// Start the server
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server listening on port ${PORT}`);
  console.log(`[Socket.IO] Health check: http://localhost:${PORT}`);
  console.log(`[Socket.IO] Waiting for first connection to complete cold start...`);
});

// Set up a periodic task to clean up stale connections and update room counts
setInterval(() => {
  try {
    console.log('[Socket.IO] Running periodic health check and cleanup');
    
    // Check for stale connections
    const connectedSockets = io.sockets.sockets;
    console.log(`[Socket.IO] Active socket connections: ${connectedSockets.size}`);
    
    // Clean up any inconsistencies between our maps and actual connected sockets
    for (const [userId, socketId] of userSockets.entries()) {
      if (!connectedSockets.has(socketId)) {
        console.log(`[Socket.IO] Cleaning up stale user: ${userId}`);
        
        // Find which rooms this user was in
        for (const [roomId, users] of rooms.entries()) {
          if (users.has(userId)) {
            // Remove user from room
            users.delete(userId);
            console.log(`[Socket.IO] Removed user ${userId} from room ${roomId}`);
            
            // If room is now empty, remove it
            if (users.size === 0) {
              rooms.delete(roomId);
              console.log(`[Socket.IO] Room ${roomId} is now empty and has been removed`);
            } else {
              // Notify room about user leaving
              io.to(roomId).emit('user_left', { 
                userId, 
                roomId,
                timestamp: new Date().toISOString()
              });
              
              // Update online users list
              updateOnlineUsers(roomId);
            }
          }
        }
        
        // Remove user from userSockets map
        userSockets.delete(userId);
        
        // Remove socket from socketUsers map
        socketUsers.delete(socketId);
      }
    }
    
    // Update online users for all rooms
    for (const roomId of rooms.keys()) {
      updateOnlineUsers(roomId);
    }
    
    // Log current stats
    console.log(`[Socket.IO] Current stats: ${rooms.size} rooms, ${userSockets.size} users`);
  } catch (error) {
    console.error('[Socket.IO] Error in periodic task:', error);
  }
}, 60000); // Run every minute

// Set up a heartbeat endpoint for health monitoring
io.on('heartbeat', (socket) => {
  socket.emit('heartbeat-ack', { timestamp: new Date().toISOString() });
});
