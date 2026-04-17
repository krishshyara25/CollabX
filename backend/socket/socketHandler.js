const Message = require('../models/Message');
const WhiteboardState = require('../models/WhiteboardState');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', ({ roomId, username }) => {
      socket.join(roomId);
      console.log(`User ${username} (${socket.id}) joined room: ${roomId}`);
      
      // Notify others in room
      socket.to(roomId).emit('receive_message', {
        id: Date.now(),
        roomId,
        username: 'System',
        text: `${username} has joined the room.`,
        isSystem: true,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('send_message', async (data) => {
      // data: { roomId, username, text, timestamp, id }
      console.log('Message received:', data);
      
      try {
          await Message.create({
              roomId: data.roomId,
              username: data.username,
              text: data.text
          });
      } catch (err) {
          console.error("Error saving message", err);
      }

      socket.to(data.roomId).emit('receive_message', data);
    });
    
    socket.on('save_whiteboard', async ({ roomId, dataURL }) => {
        try {
            await WhiteboardState.findOneAndUpdate(
                { roomId },
                { dataURL },
                { upsert: true, new: true }
            );
        } catch (err) {
            console.error("Error saving whiteboard state", err);
        }
    });

    socket.on('recording_started', ({ roomId, isRecording }) => {
        socket.to(roomId).emit('recording_status', { isRecording });
    });

    socket.on('draw_event', (data) => {
        // Broadcast drawing event to specifically the same room
        socket.to(data.roomId).emit('draw_receive', data);
    });
    
    socket.on('clear_whiteboard', (roomId) => {
        socket.to(roomId).emit('clear_whiteboard_receive');
    });

    socket.on('timer_update', (data) => {
        // Synchronized timer info: { roomId, type: 'start'|'pause'|'reset', timeLeft, currentMode }
        socket.to(data.roomId).emit('receive_timer_update', data);
    });

    socket.on('disconnect_from_room', ({ roomId, username }) => {
        socket.leave(roomId);
        socket.to(roomId).emit('receive_message', {
            id: Date.now(),
            roomId,
            username: 'System',
            text: `${username} has left the room.`,
            isSystem: true,
            timestamp: new Date().toISOString()
        });
        socket.to(roomId).emit('user_disconnected_video', socket.id);
    });

    // WebRTC Signaling
    socket.on('start_video_call', ({ roomId, callerName, targetUsers }) => {
        socket.to(roomId).emit('incoming_video_call', { callerName, targetUsers, roomId });
    });
    
    socket.on('admin_end_call', (roomId) => {
        socket.to(roomId).emit('admin_end_call_receive');
    });

    socket.on('join_video', (roomId) => {
        socket.to(roomId).emit('user_connected_video', socket.id);
    });

    socket.on('webrtc_offer', (data) => {
        // data: { userToSignal, callerID, signal }
        io.to(data.userToSignal).emit('webrtc_offer_receive', { signal: data.signal, callerID: data.callerID });
    });

    socket.on('webrtc_answer', (data) => {
        // data: { callerID, signal }
        io.to(data.callerID).emit('webrtc_answer_receive', { signal: data.signal, id: socket.id });
    });

    socket.on('whiteboard_toggle_lock', ({ roomId, isLocked }) => {
        socket.to(roomId).emit('whiteboard_lock_status', isLocked);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Assuming they might be in rooms, their socket leaving will trigger standard timeout drops in WebRTC
    });
  });
};

module.exports = socketHandler;
