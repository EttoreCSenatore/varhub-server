const pool = require('./db');

console.log('Adding vr_video_url column to projects table and ensuring sample data exists...');

// First, check if the column already exists
pool.query(`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'projects' AND column_name = 'vr_video_url'
`, (err, res) => {
  if (err) {
    console.error('Error checking for vr_video_url column:', err);
    pool.end();
    return;
  } 
  
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
        return;
      }
      
      console.log('vr_video_url column added successfully');
      insertSampleData();
    });
  }
});

// Function to insert sample data with the VR video URLs
function insertSampleData() {
  // Check if we have any projects in the database
  pool.query('SELECT COUNT(*) FROM projects', (err, res) => {
    if (err) {
      console.error('Error checking project count:', err);
      pool.end();
      return;
    }
    
    const count = parseInt(res.rows[0].count);
    
    if (count === 0) {
      // Insert multiple sample projects with VR video URLs
      const sampleProjects = [
        {
          name: 'Solar System VR Tour',
          description: 'Explore the solar system in immersive 360° virtual reality. Learn about planets, moons, and other celestial bodies.',
          thumbnail_url: 'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
          vr_video_url: 'https://cdn.aframe.io/360-video-boilerplate/video/city.mp4',
          status: 'published'
        },
        {
          name: 'Underwater Exploration',
          description: 'Dive into the depths of the ocean with this stunning VR experience. Observe marine life in their natural habitat.',
          thumbnail_url: 'https://images.unsplash.com/photo-1682686580391-8ace8709092a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
          vr_video_url: 'https://storage.googleapis.com/cardinal-choir-254220.appspot.com/homepage/360-video-forest.mp4',
          status: 'published'
        },
        {
          name: 'Mount Everest Expedition',
          description: 'Experience the thrill of climbing Mount Everest in VR without the physical risks. Stunning 360° views from the world\'s highest peak.',
          thumbnail_url: 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
          vr_video_url: 'https://cdn.aframe.io/360-video-boilerplate/video/city.mp4',
          status: 'published'
        }
      ];
      
      // Using Promise.all to insert all projects
      Promise.all(
        sampleProjects.map(project => {
          return pool.query(
            `INSERT INTO projects (name, description, thumbnail_url, vr_video_url, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [project.name, project.description, project.thumbnail_url, project.vr_video_url, project.status]
          );
        })
      )
      .then(results => {
        console.log(`${results.length} sample projects inserted successfully`);
        // Get the project IDs for AR content insertion
        return Promise.all(
          results.map((result, index) => {
            const projectId = result.rows[0].id;
            // Insert sample AR content for each project
            return pool.query(
              `INSERT INTO ar_content (project_id, marker_image_url, model_3d_url)
               VALUES ($1, $2, $3)`,
              [
                projectId,
                `https://raw.githubusercontent.com/AR-js-org/AR.js/master/three.js/examples/marker-training/examples/pattern-files/pattern-hiro.png`,
                `https://cdn.aframe.io/examples/models/duck/duck.gltf`
              ]
            );
          })
        );
      })
      .then(() => {
        console.log('AR content added for sample projects');
        pool.end();
      })
      .catch(error => {
        console.error('Error inserting sample data:', error);
        pool.end();
      });
    } else {
      // Update existing projects with VR video URLs if they don't have one
      pool.query(`
        UPDATE projects 
        SET vr_video_url = 
          CASE 
            WHEN id % 3 = 0 THEN 'https://cdn.aframe.io/360-video-boilerplate/video/city.mp4'
            WHEN id % 3 = 1 THEN 'https://storage.googleapis.com/cardinal-choir-254220.appspot.com/homepage/360-video-forest.mp4'
            ELSE 'https://cdn.aframe.io/360-video-boilerplate/video/city.mp4'
          END
        WHERE vr_video_url IS NULL OR vr_video_url = ''
      `, (err, result) => {
        if (err) {
          console.error('Error updating projects with VR videos:', err);
        } else {
          console.log(`Updated ${result.rowCount} projects with VR video URLs`);
        }
        pool.end();
      });
    }
  });
} 