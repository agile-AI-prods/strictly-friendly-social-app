const { getDatabase } = require('../config/database');
const { UUID } = require('mongodb');

// Create a new call record
exports.createCall = async (callData) => {
  try {
    const db = await getDatabase();
    const callsCollection = db.collection('calls');
    
    // Convert string IDs to UUID objects if needed
    let callerIdUUID, receiverIdUUID;
    try {
      callerIdUUID = new UUID(callData.caller_id);
      receiverIdUUID = new UUID(callData.receiver_id);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      callerIdUUID = callData.caller_id;
      receiverIdUUID = callData.receiver_id;
    }
    
    // Generate new UUID for the call
    const callId = new UUID();
    
    const newCall = {
      _id: callId,
      caller_id: callerIdUUID,
      receiver_id: receiverIdUUID,
      call_type: callData.call_type || 'voice',
      status: callData.status || 'initiating',
      started_at: callData.started_at || new Date().toISOString(),
      answered_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await callsCollection.insertOne(newCall);
    const createdCall = { ...newCall, _id: result.insertedId };
    
    return {
      ...createdCall,
      id: createdCall._id.toString(),
      caller_id: createdCall.caller_id.toString(),
      receiver_id: createdCall.receiver_id.toString()
    };
  } catch (error) {
    console.error('Error in createCall:', error);
    throw error;
  }
};

// Update call status
exports.updateCallStatus = async (callId, updates) => {
  try {
    const db = await getDatabase();
    const callsCollection = db.collection('calls');
    
    // Convert string ID to UUID if needed
    let callIdUUID;
    try {
      callIdUUID = new UUID(callId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      callIdUUID = callId;
    }
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const result = await callsCollection.updateOne(
      { _id: callIdUUID },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Call not found');
    }
    
    // Get updated call
    const updatedCall = await callsCollection.findOne({ _id: callIdUUID });
    
    return {
      ...updatedCall,
      id: updatedCall._id.toString(),
      caller_id: updatedCall.caller_id.toString(),
      receiver_id: updatedCall.receiver_id.toString()
    };
  } catch (error) {
    console.error('Error in updateCallStatus:', error);
    throw error;
  }
};

// Get call by ID
exports.getCallById = async (callId) => {
  try {
    const db = await getDatabase();
    const callsCollection = db.collection('calls');
    
    // Convert string ID to UUID if needed
    let callIdUUID;
    try {
      callIdUUID = new UUID(callId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      callIdUUID = callId;
    }
    
    const call = await callsCollection.findOne({ _id: callIdUUID });
    
    if (!call) {
      throw new Error('Call not found');
    }
    
    return {
      ...call,
      id: call._id.toString(),
      caller_id: call.caller_id.toString(),
      receiver_id: call.receiver_id.toString()
    };
  } catch (error) {
    console.error('Error in getCallById:', error);
    throw error;
  }
};

// Get calls for a user (as caller or receiver)
exports.getUserCalls = async (userId, limit = 50) => {
  try {
    const db = await getDatabase();
    const callsCollection = db.collection('calls');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      userIdUUID = userId;
    }
    
    const calls = await callsCollection.find({
      $or: [
        { caller_id: userIdUUID },
        { receiver_id: userIdUUID }
      ]
    })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
    
    // Transform for client (convert UUIDs to strings)
    return calls.map(call => ({
      ...call,
      id: call._id.toString(),
      caller_id: call.caller_id.toString(),
      receiver_id: call.receiver_id.toString()
    }));
  } catch (error) {
    console.error('Error in getUserCalls:', error);
    throw error;
  }
};

// Get recent calls between two users
exports.getRecentCallsBetweenUsers = async (userId1, userId2, limit = 10) => {
  try {
    const db = await getDatabase();
    const callsCollection = db.collection('calls');
    
    // Convert string IDs to UUID objects if needed
    let userId1UUID, userId2UUID;
    try {
      userId1UUID = new UUID(userId1);
      userId2UUID = new UUID(userId2);
    } catch (uuidError) {
      // If not valid UUIDs, use strings directly (for ObjectId)
      userId1UUID = userId1;
      userId2UUID = userId2;
    }
    
    const calls = await callsCollection.find({
      $or: [
        { caller_id: userId1UUID, receiver_id: userId2UUID },
        { caller_id: userId2UUID, receiver_id: userId1UUID }
      ]
    })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
    
    // Transform for client (convert UUIDs to strings)
    return calls.map(call => ({
      ...call,
      id: call._id.toString(),
      caller_id: call.caller_id.toString(),
      receiver_id: call.receiver_id.toString()
    }));
  } catch (error) {
    console.error('Error in getRecentCallsBetweenUsers:', error);
    throw error;
  }
};

// End a call
exports.endCall = async (callId, endReason = 'ended') => {
  try {
    const db = await getDatabase();
    const callsCollection = db.collection('calls');
    
    // Convert string ID to UUID if needed
    let callIdUUID;
    try {
      callIdUUID = new UUID(callId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      callIdUUID = callId;
    }
    
    const updates = {
      status: 'ended',
      updated_at: new Date().toISOString()
    };
    
    // If the call was answered, set answered_at
    const call = await callsCollection.findOne({ _id: callIdUUID });
    if (call && call.status === 'active' && !call.answered_at) {
      updates.answered_at = new Date().toISOString();
    }
    
    const result = await callsCollection.updateOne(
      { _id: callIdUUID },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Call not found');
    }
    
    return { success: true, callId };
  } catch (error) {
    console.error('Error in endCall:', error);
    throw error;
  }
};

// Get call statistics for a user
exports.getCallStats = async (userId) => {
  try {
    const db = await getDatabase();
    const callsCollection = db.collection('calls');
    
    // Convert string ID to UUID if needed
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      // If not a valid UUID, use string directly (for ObjectId)
      userIdUUID = userId;
    }
    
    const pipeline = [
      {
        $match: {
          $or: [
            { caller_id: userIdUUID },
            { receiver_id: userIdUUID }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          answeredCalls: { $sum: { $cond: [{ $ne: ['$answered_at', null] }, 1, 0] } },
          missedCalls: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } },
          totalDuration: { $sum: { $cond: [{ $ne: ['$answered_at', null] }, { $subtract: ['$answered_at', '$started_at'] }, 0] } }
        }
      }
    ];
    
    const result = await callsCollection.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return {
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        totalDuration: 0
      };
    }
    
    return result[0];
  } catch (error) {
    console.error('Error in getCallStats:', error);
    throw error;
  }
};
