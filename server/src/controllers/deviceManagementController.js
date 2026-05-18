const deviceManagementService = require('../services/deviceManagementService');

// Record device login for the authenticated user
exports.recordDeviceLogin = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found' });
    }

    const result = await deviceManagementService.recordDeviceLogin(req, userEmail);
    
    if (result) {
      res.json({
        success: true,
        message: 'Device login recorded successfully',
        data: result
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to record device login',
        message: 'Could not record device login information'
      });
    }
  } catch (error) {
    console.error('Error recording device login:', error);
    res.status(500).json({ 
      error: 'Failed to record device login',
      message: error.message 
    });
  }
};

// Get device login history for the authenticated user
exports.getDeviceLoginHistory = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found' });
    }

    const deviceHistory = await deviceManagementService.getDeviceLoginHistory(userEmail);
    
    res.json({
      success: true,
      data: deviceHistory
    });
  } catch (error) {
    console.error('Error fetching device login history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch device login history',
      message: error.message 
    });
  }
};

// Delete a specific device login record
exports.deleteDeviceLoginRecord = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const recordId = req.params.recordId;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found' });
    }

    if (!recordId) {
      return res.status(400).json({ error: 'Record ID is required' });
    }

    await deviceManagementService.deleteDeviceLoginRecord(userEmail, recordId);
    
    res.json({
      success: true,
      message: 'Device login record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device login record:', error);
    res.status(500).json({ 
      error: 'Failed to delete device login record',
      message: error.message 
    });
  }
};



