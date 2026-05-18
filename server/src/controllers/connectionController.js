const connectionService = require('../services/connectionService');

exports.getConnectedConnections = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const connections = await connectionService.getConnectedConnections(userId);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching connected connections:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingConnections = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const connections = await connectionService.getPendingConnections(userId);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching pending connections:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSentConnections = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const connections = await connectionService.getSentConnections(userId);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching sent connections:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRejectedConnections = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const connections = await connectionService.getRejectedConnections(userId);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching rejected connections:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserConnectedConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    const connections = await connectionService.getUserConnectedConnections(userId);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching user connected connections:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFriendsCount = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    const count = await connectionService.getFriendsCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching friends count:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getConnectionStatuses = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { userIds } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!userIds || userIds.trim() === '') {
      return res.status(400).json({ error: 'userIds parameter is required' });
    }

    const userIdsArray = userIds.split(',').filter(id => id.trim() !== '');
    
    if (userIdsArray.length === 0) {
      return res.json({});
    }

    const statuses = await connectionService.getConnectionStatuses(userId, userIdsArray);
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching connection statuses:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.sendConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { receiverId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required' });
    }

    const connection = await connectionService.sendConnectionRequest(userId, receiverId);
    res.json(connection);
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.acceptConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const connection = await connectionService.acceptConnectionRequest(id, userId);
    res.json(connection);
  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.rejectConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const connection = await connectionService.rejectConnectionRequest(id, userId);
    res.json(connection);
  } catch (error) {
    console.error('Error rejecting connection request:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.removeConnection = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await connectionService.removeConnection(id, userId);
    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ error: error.message });
  }
}; 