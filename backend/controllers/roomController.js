const Room = require('../models/Room');

const createRoom = async (req, res) => {
  try {
    const { name, description, isPrivate, passcode } = req.body;
    
    if (isPrivate && !passcode) {
        return res.status(400).json({ message: 'Private rooms require a passcode' });
    }

    const room = await Room.create({
      name,
      description: description || 'Collaborative study session',
      creator: req.user._id,
      participants: [req.user._id],
      isPrivate: isPrivate || false,
      passcode: isPrivate ? passcode : undefined
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('creator', 'username email')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username')
      .populate('participants', 'username');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.isPrivate) {
            const { passcode } = req.body;
            if (room.passcode !== passcode) {
                return res.status(401).json({ message: 'Invalid passcode' });
            }
        }

        if (!room.participants.includes(req.user._id)) {
            room.participants.push(req.user._id);
            await room.save();
        }

        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// New: Leave Room
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Remove user from participants
    room.participants = room.participants.filter(
      id => id.toString() !== req.user._id.toString()
    );

    // If no participants left and user was creator → delete room
    if (room.participants.length === 0) {
      await room.deleteOne();
      return res.json({ message: 'Room deleted successfully' });
    }

    // If creator left, assign new creator (first participant)
    if (room.creator.toString() === req.user._id.toString() && room.participants.length > 0) {
      room.creator = room.participants[0];
    }

    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ creator: req.user._id })
      .populate('creator', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createRoom, 
  getRooms, 
  getRoom, 
  joinRoom,
  leaveRoom,      // ← Added
  getMyRooms 
};