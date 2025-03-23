const pool = require('./db');

console.log('Adding vr_video_url column to projects table...');

// First, check if the column already exists
pool.query(`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'projects' AND column_name = 'vr_video_url'
`, (err, res) => {
  if (err) {
    console.error('Error checking for vr_video_url column:', err);
    pool.end();
  } else {
    if (res.rows.length > 0) {
      console.log('vr_video_url column already exists');
      insertSampleData();
    } else {
      console.log('Adding vr_video_url column to projects table...');
      
      // Add the vr_video_url column
      pool.query(`
        ALTER TABLE projects 
        ADD COLUMN vr_video_url VARCHAR(255)
      `, (err) => {
        if (err) {
          console.error('Error adding vr_video_url column:', err);
          pool.end();
        } else {
          console.log('vr_video_url column added successfully');
          insertSampleData();
        }
      });
    }
  }
});

// Function to insert sample data with the AWS VR video URL
function insertSampleData() {
  // Check if we have any projects in the database
  pool.query('SELECT COUNT(*) FROM projects', (err, res) => {
    if (err) {
      console.error('Error checking project count:', err);
      pool.end();
    } else {
      const count = parseInt(res.rows[0].count);
      
      if (count === 0) {
        // Insert a sample project with VR video URL
        pool.query(`
          INSERT INTO projects (name, description, thumbnail_url, vr_video_url, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          'Project Alpha',
          'A sample VR experience demonstrating educational content in 360°',
          '/project-alpha-thumb.jpg',
          'https://varhub-videos.s3.us-east-2.amazonaws.com/project-alpha-360.mp4',
          'published'
        ], (err) => {
          if (err) {
            console.error('Error inserting sample project:', err);
          } else {
            console.log('Sample project with VR video URL inserted successfully');
          }
          pool.end();
        });
      } else {
        // Update existing projects with the VR video URL
        pool.query(`
          UPDATE projects 
          SET vr_video_url = $1 
          WHERE id = 1 AND (vr_video_url IS NULL OR vr_video_url = '')
        `, ['https://varhub-videos.s3.us-east-2.amazonaws.com/project-alpha-360.mp4'], (err) => {
          if (err) {
            console.error('Error updating project:', err);
          } else {
            console.log('Updated project with VR video URL');
          }
          pool.end();
        });
      }
    }
  });
} 