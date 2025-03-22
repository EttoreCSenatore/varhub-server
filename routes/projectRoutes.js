const express = require('express');  
const { getProjects, getProjectById } = require('../controllers/projectController');  

const router = express.Router();  

router.get('/projects', getProjects);  
router.get('/projects/:id', getProjectById);

module.exports = router;