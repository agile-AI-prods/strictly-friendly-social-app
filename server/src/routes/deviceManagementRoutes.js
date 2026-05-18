const express = require('express');
const router = express.Router();
const deviceManagementController = require('../controllers/deviceManagementController');
const { authenticateToken } = require('../middleware/auth');

// Record device login
router.post('/record', authenticateToken, deviceManagementController.recordDeviceLogin);

// Get device login history for the authenticated user
router.get('/history', authenticateToken, deviceManagementController.getDeviceLoginHistory);

// Delete a specific device login record
router.delete('/record/:recordId', authenticateToken, deviceManagementController.deleteDeviceLoginRecord);



module.exports = router;

