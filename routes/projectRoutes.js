const express = require('express');  
const { getProjects, getProjectById } = require('../controllers/projectController');  

const { optionalAuth } = require('../middleware/auth');

const router = express.Router();  

router.get('/projects', getProjects);  
router.get('/projects/:id', optionalAuth, getProjectById);

module.exports = router;