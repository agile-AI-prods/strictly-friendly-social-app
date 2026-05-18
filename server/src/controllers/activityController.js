const activityService = require('../services/activityService');

exports.getAllActivities = async (req, res) => {
  try {
    const activities = await activityService.getAllActivities();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await activityService.getActivityById(req.params.id);
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const activityData = { ...req.body, creator_id: userId };
    const created = await activityService.createActivity(activityData);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const updated = await activityService.updateActivity(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const deleted = await activityService.deleteActivity(req.params.id);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const filters = req.query;
    // Convert type to array if present
    if (filters.type && typeof filters.type === 'string') {
      filters.type = filters.type.split(',');
    }
    const activities = await activityService.getActivities(filters);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.inviteParticipants = async (req, res) => {
  try {
    const { activityId, userIds } = req.body;
    const data = await activityService.inviteParticipants(activityId, userIds);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateParticipantStatus = async (req, res) => {
  try {
    const { activityId, userId, status } = req.body;
    const data = await activityService.updateParticipantStatus(activityId, userId, status);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSuggestedActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await activityService.getSuggestedActivities(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = await activityService.uploadActivityImage(req.file);
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 