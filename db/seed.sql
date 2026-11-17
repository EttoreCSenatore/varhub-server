-- Demo content for local development (npm run db:seed). Third-party assets are public samples.
INSERT INTO projects (name, description, type, status, thumbnail_url, ar_model_url, ios_model_url)
SELECT 'Astronaut (3D model)', 'A 3D model you can rotate and place in your room with AR on supported phones.', 'model', 'published',
       'https://modelviewer.dev/shared-assets/models/Astronaut.webp',
       'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
       'https://modelviewer.dev/shared-assets/models/Astronaut.usdz'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Astronaut (3D model)');

INSERT INTO projects (name, description, type, status, page_url)
SELECT 'Immersive AR session (WebXR demo)', 'Official WebXR sample. Needs Chrome on an ARCore Android phone.', 'webxr', 'published',
       'https://immersive-web.github.io/webxr-samples/immersive-ar-session.html'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Immersive AR session (WebXR demo)');

INSERT INTO projects (name, description, type, status, page_url)
SELECT 'Hit-test placement (WebXR demo)', 'Place objects on real surfaces. Needs Chrome on an ARCore Android phone.', 'webxr', 'published',
       'https://immersive-web.github.io/webxr-samples/hit-test.html'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Hit-test placement (WebXR demo)');

INSERT INTO projects (name, description, type, status, page_url)
SELECT 'VARLab', 'Learn more about VARLab and its work.', 'link', 'published', 'https://www.conestogac.on.ca/'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'VARLab');
