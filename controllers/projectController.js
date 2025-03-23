// backend/controllers/projectController.js
const pool = require('../db');

// Get all projects with AR content
const getProjects = async (req, res) => {
  try {
    const projects = await pool.query(
      `SELECT p.*, a.marker_image_url, a.model_3d_url 
       FROM projects p 
       LEFT JOIN ar_content a ON p.id = a.project_id`
    );
    res.status(200).json(projects.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log project view
    await pool.query(
      'INSERT INTO engagement_logs (user_id, action_type, project_id) VALUES ($1, $2, $3)',
      [1, 'project_view', id] // Replace 1 with actual user ID later
    );

    const project = await pool.query(
      `SELECT p.*, a.marker_image_url, a.model_3d_url 
       FROM projects p 
       LEFT JOIN ar_content a ON p.id = a.project_id 
       WHERE p.id = $1`,
      [id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProjects, getProjectById };