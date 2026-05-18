const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Helper function to enrich connections with avatar data
const enrichConnectionsWithAvatars = async (connections) => {
  try {
    const db = await getDatabase();
    const profilesCollection = db.collection('profiles');
    
    const enrichedConnections = await Promise.all(
      connections.map(async (connection) => {
        // Get sender profile
        let senderProfile = null;
        try {
          const senderIdUUID = new UUID(connection.sender_id);
          senderProfile = await profilesCollection.findOne({ _id: senderIdUUID });
        } catch (uuidError) {
          senderProfile = await profilesCollection.findOne({ _id: connection.sender_id });
        }
        
        // Get receiver profile
        let receiverProfile = null;
        try {
          const receiverIdUUID = new UUID(connection.receiver_id);
          receiverProfile = await profilesCollection.findOne({ _id: receiverIdUUID });
        } catch (uuidError) {
          receiverProfile = await profilesCollection.findOne({ _id: connection.receiver_id });
        }
        
        return {
          ...connection,
          sender: senderProfile ? {
            ...senderProfile,
            id: senderProfile._id.toString()
          } : null,
          receiver: receiverProfile ? {
            ...receiverProfile,
            id: receiverProfile._id.toString()
          } : null
        };
      })
    );
    
    return enrichedConnections;
  } catch (error) {
    console.error('Error enriching connections with avatars:', error);
    return connections;
  }
};

// Fetch connected connections (accepted connections where user is sender or receiver)
exports.getConnectedConnections = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    const transformedConnections = connections.map(connection => ({
      ...connection,
      id: connection._id.toString(),
      sender_id: connection.sender_id.toString(),
      receiver_id: connection.receiver_id.toString()
    }));
    
    return await enrichConnectionsWithAvatars(transformedConnections);
  } catch (error) {
    console.error('Error in getConnectedConnections:', error);
    throw error;
  }
};

// Fetch pending connections (user is receiver, status is pending)
exports.getPendingConnections = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const connections = await connectionsCollection.find({
      receiver_id: userIdUUID,
      sender_id: { $ne: userIdUUID },
      status: 'pending'
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    const transformedConnections = connections.map(connection => ({
      ...connection,
      id: connection._id.toString(),
      sender_id: connection.sender_id.toString(),
      receiver_id: connection.receiver_id.toString()
    }));
    
    return await enrichConnectionsWithAvatars(transformedConnections);
  } catch (error) {
    console.error('Error in getPendingConnections:', error);
    throw error;
  }
};

// Fetch sent connections (user is sender, status is pending)
exports.getSentConnections = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const connections = await connectionsCollection.find({
      sender_id: userIdUUID,
      receiver_id: { $ne: userIdUUID },
      status: 'pending'
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    const transformedConnections = connections.map(connection => ({
      ...connection,
      id: connection._id.toString(),
      sender_id: connection.sender_id.toString(),
      receiver_id: connection.receiver_id.toString()
    }));
    
    return await enrichConnectionsWithAvatars(transformedConnections);
  } catch (error) {
    console.error('Error in getSentConnections:', error);
    throw error;
  }
};

// Fetch rejected connections (user is sender or receiver, status is rejected)
exports.getRejectedConnections = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'rejected' },
        { receiver_id: userIdUUID, status: 'rejected' }
      ]
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    const transformedConnections = connections.map(connection => ({
      ...connection,
      id: connection._id.toString(),
      sender_id: connection.sender_id.toString(),
      receiver_id: connection.receiver_id.toString()
    }));
    
    return await enrichConnectionsWithAvatars(transformedConnections);
  } catch (error) {
    console.error('Error in getRejectedConnections:', error);
    throw error;
  }
};

// Fetch connected connections for any userId (not just current user)
exports.getUserConnectedConnections = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    }).toArray();
    
    // Transform for client (convert UUIDs to strings)
    const transformedConnections = connections.map(connection => ({
      ...connection,
      id: connection._id.toString(),
      sender_id: connection.sender_id.toString(),
      receiver_id: connection.receiver_id.toString()
    }));
    
    return await enrichConnectionsWithAvatars(transformedConnections);
  } catch (error) {
    console.error('Error in getUserConnectedConnections:', error);
    throw error;
  }
};

// Get friends count for a user (accepted connections)
exports.getFriendsCount = async (userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }
    
    const count = await connectionsCollection.countDocuments({
      $or: [
        { sender_id: userIdUUID, status: 'accepted' },
        { receiver_id: userIdUUID, status: 'accepted' }
      ]
    });
    
    return count || 0;
  } catch (error) {
    console.error('Error in getFriendsCount:', error);
    throw error;
  }
};

// Get connection statuses for multiple users
exports.getConnectionStatuses = async (currentUserId, userIds) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string IDs to UUIDs if needed
    let currentUserIdUUID;
    let userIdsUUIDs = [];
    
    try {
      currentUserIdUUID = new UUID(currentUserId);
      userIdsUUIDs = userIds.map(id => new UUID(id));
    } catch (uuidError) {
      currentUserIdUUID = currentUserId;
      userIdsUUIDs = userIds;
    }
    
    const connections = await connectionsCollection.find({
      $or: [
        { sender_id: currentUserIdUUID, receiver_id: { $in: userIdsUUIDs } },
        { sender_id: { $in: userIdsUUIDs }, receiver_id: currentUserIdUUID }
      ]
    }).toArray();
    
    // Convert the array of connections to a map of userId -> status
    const statusMap = {};
    userIds.forEach(id => {
      const connection = connections.find(c => {
        const senderId = c.sender_id.toString();
        const receiverId = c.receiver_id.toString();
        return (senderId === currentUserId && receiverId === id) ||
               (senderId === id && receiverId === currentUserId);
      });
      statusMap[id] = connection?.status || null;
    });
    
    return statusMap;
  } catch (error) {
    console.error('Error in getConnectionStatuses:', error);
    throw error;
  }
};

// Send connection request
exports.sendConnectionRequest = async (senderId, receiverId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string IDs to UUIDs if needed
    let senderIdUUID, receiverIdUUID;
    try {
      senderIdUUID = new UUID(senderId);
      receiverIdUUID = new UUID(receiverId);
    } catch (uuidError) {
      senderIdUUID = senderId;
      receiverIdUUID = receiverId;
    }
    
    // Generate new UUID for the connection
    const connectionId = new UUID();
    
    const newConnection = {
      _id: connectionId,
      sender_id: senderIdUUID,
      receiver_id: receiverIdUUID,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await connectionsCollection.insertOne(newConnection);
    const createdConnection = { ...newConnection, _id: result.insertedId };
    
    // Transform for client (convert UUIDs to strings)
    const transformedConnection = {
      ...createdConnection,
      id: createdConnection._id.toString(),
      sender_id: createdConnection.sender_id.toString(),
      receiver_id: createdConnection.receiver_id.toString()
    };
    
    // Enrich with profile data
    const enrichedConnections = await enrichConnectionsWithAvatars([transformedConnection]);
    return enrichedConnections[0];
  } catch (error) {
    console.error('Error in sendConnectionRequest:', error);
    throw error;
  }
};

// Accept connection request
exports.acceptConnectionRequest = async (connectionId, userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string IDs to UUIDs if needed
    let connectionIdUUID, userIdUUID;
    try {
      connectionIdUUID = new UUID(connectionId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      connectionIdUUID = connectionId;
      userIdUUID = userId;
    }
    
    // First verify the user is the receiver of this connection
    const connection = await connectionsCollection.findOne({
      _id: connectionIdUUID,
      receiver_id: userIdUUID
    });
    
    if (!connection) {
      throw new Error('Connection not found or unauthorized');
    }
    
    const result = await connectionsCollection.updateOne(
      { _id: connectionIdUUID },
      {
        $set: {
          status: 'accepted',
          updated_at: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Connection not found');
    }
    
    // Get updated connection
    const updatedConnection = await connectionsCollection.findOne({ _id: connectionIdUUID });
    
    // Transform for client (convert UUIDs to strings)
    const transformedConnection = {
      ...updatedConnection,
      id: updatedConnection._id.toString(),
      sender_id: updatedConnection.sender_id.toString(),
      receiver_id: updatedConnection.receiver_id.toString()
    };
    
    // Enrich with profile data
    const enrichedConnections = await enrichConnectionsWithAvatars([transformedConnection]);
    return enrichedConnections[0];
  } catch (error) {
    console.error('Error in acceptConnectionRequest:', error);
    throw error;
  }
};

// Reject connection request
exports.rejectConnectionRequest = async (connectionId, userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string IDs to UUIDs if needed
    let connectionIdUUID, userIdUUID;
    try {
      connectionIdUUID = new UUID(connectionId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      connectionIdUUID = connectionId;
      userIdUUID = userId;
    }
    
    // First verify the user is the receiver of this connection
    const connection = await connectionsCollection.findOne({
      _id: connectionIdUUID,
      receiver_id: userIdUUID
    });
    
    if (!connection) {
      throw new Error('Connection not found or unauthorized');
    }
    
    const result = await connectionsCollection.updateOne(
      { _id: connectionIdUUID },
      {
        $set: {
          status: 'rejected',
          updated_at: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Connection not found');
    }
    
    return { success: true, connectionId };
  } catch (error) {
    console.error('Error in rejectConnectionRequest:', error);
    throw error;
  }
};

// Cancel connection request
exports.cancelConnectionRequest = async (connectionId, userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string IDs to UUIDs if needed
    let connectionIdUUID, userIdUUID;
    try {
      connectionIdUUID = new UUID(connectionId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      connectionIdUUID = connectionId;
      userIdUUID = userId;
    }
    
    // First verify the user is the sender of this connection
    const connection = await connectionsCollection.findOne({
      _id: connectionIdUUID,
      sender_id: userIdUUID,
      status: 'pending'
    });
    
    if (!connection) {
      throw new Error('Connection not found or unauthorized');
    }
    
    const result = await connectionsCollection.deleteOne({ _id: connectionIdUUID });
    
    if (result.deletedCount === 0) {
      throw new Error('Connection not found');
    }
    
    return { success: true, connectionId };
  } catch (error) {
    console.error('Error in cancelConnectionRequest:', error);
    throw error;
  }
};

// Remove connection (for both users)
exports.removeConnection = async (connectionId, userId) => {
  try {
    const db = await getDatabase();
    const connectionsCollection = db.collection('connections');
    
    // Convert string IDs to UUIDs if needed
    let connectionIdUUID, userIdUUID;
    try {
      connectionIdUUID = new UUID(connectionId);
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      connectionIdUUID = connectionId;
      userIdUUID = userId;
    }
    
    // First verify the user is part of this connection
    const connection = await connectionsCollection.findOne({
      _id: connectionIdUUID,
      $or: [
        { sender_id: userIdUUID },
        { receiver_id: userIdUUID }
      ]
    });
    
    if (!connection) {
      throw new Error('Connection not found or unauthorized');
    }
    
    const result = await connectionsCollection.deleteOne({ _id: connectionIdUUID });
    
    if (result.deletedCount === 0) {
      throw new Error('Connection not found');
    }
    
    return { success: true, connectionId };
  } catch (error) {
    console.error('Error in removeConnection:', error);
    throw error;
  }
}; 