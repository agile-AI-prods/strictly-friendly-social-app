const commentService = require('../services/commentService');

exports.getAllComments = async (req, res) => {
    try {
        const { activityId } = req.query;
        if (!activityId) {
            return res.status(400).json({ error: 'Activity ID is required' });
        }
        const comments = await commentService.getCommentsByActivityId(activityId);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCommentById = async (req, res) => {
    try {
        const comment = await commentService.getCommentById(req.params.id);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createComment = async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { activityId, content } = req.body;
        if (!activityId || !content) {
            return res.status(400).json({ error: 'Activity ID and content are required' });
        }
        console.log(userId, activityId, content);
        const comment = await commentService.createComment(userId, activityId, content);
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const userId = req.user.id || req.user.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const comment = await commentService.updateComment(req.params.id, userId, content);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const success = await commentService.deleteComment(req.params.id, userId);
        if (!success) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 