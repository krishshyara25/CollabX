const CalendarLog = require('../models/CalendarLog');

const getLogs = async (req, res) => {
  try {
    const logs = await CalendarLog.find({ user: req.user._id }).sort({ date: 1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLog = async (req, res) => {
  try {
    const { date, title, content } = req.body;
    const log = await CalendarLog.create({
      user: req.user._id,
      date,
      title,
      content
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLog = async (req, res) => {
  try {
    const log = await CalendarLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    log.title = req.body.title || log.title;
    log.content = req.body.content || log.content;
    
    const updatedLog = await log.save();
    res.json(updatedLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLog = async (req, res) => {
  try {
    const log = await CalendarLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await log.deleteOne();
    res.json({ message: 'Log removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLogs, createLog, updateLog, deleteLog };
