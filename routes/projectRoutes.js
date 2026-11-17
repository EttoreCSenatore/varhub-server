const express = require('express');
const { listProjects, getProject, createProject, updateProject, listAllProjects } = require('../controllers/projectController');
const { projectFeedback } = require('../controllers/feedbackController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/projects', listProjects);
router.get('/projects/:id', getProject);
router.get('/projects/:id/feedback', projectFeedback);

router.get('/admin/projects', requireAdmin, listAllProjects);
router.post('/projects', requireAdmin, createProject);
router.put('/projects/:id', requireAdmin, updateProject);

module.exports = router;
