const callService = require('../services/callService');

// Create a new call
exports.createCall = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { receiver_id, call_type, status } = req.body;
    
    if (!receiver_id) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    const callData = {
      caller_id: userId,
      receiver_id,
      call_type: call_type || 'voice',
      status: status || 'initiating'
    };

    const call = await callService.createCall(callData);
    res.status(201).json(call);
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get call by ID
exports.getCallById = async (req, res) => {
  try {
    const { callId } = req.params;
    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    const call = await callService.getCallById(callId);
    res.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update call status
exports.updateCallStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { callId } = req.params;
    const updates = req.body;

    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    // Verify user is part of the call
    const call = await callService.getCallById(callId);
    if (call.caller_id !== userId && call.receiver_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this call' });
    }

    const updatedCall = await callService.updateCallStatus(callId, updates);
    res.json(updatedCall);
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user's calls
exports.getUserCalls = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { limit } = req.query;
    const calls = await callService.getUserCalls(userId, limit ? parseInt(limit) : 50);
    res.json(calls);
  } catch (error) {
    console.error('Error fetching user calls:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get recent calls between two users
exports.getRecentCallsBetweenUsers = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { otherUserId } = req.params;
    const { limit } = req.query;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    const calls = await callService.getRecentCallsBetweenUsers(
      userId, 
      otherUserId, 
      limit ? parseInt(limit) : 10
    );
    res.json(calls);
  } catch (error) {
    console.error('Error fetching recent calls between users:', error);
    res.status(500).json({ error: error.message });
  }
};

// End a call
exports.endCall = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { callId } = req.params;
    const { endReason } = req.body;

    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    // Verify user is part of the call
    const call = await callService.getCallById(callId);
    if (call.caller_id !== userId && call.receiver_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to end this call' });
    }

    const result = await callService.endCall(callId, endReason);
    res.json(result);
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get call statistics for user
exports.getCallStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await callService.getCallStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching call stats:', error);
    res.status(500).json({ error: error.message });
  }
};
