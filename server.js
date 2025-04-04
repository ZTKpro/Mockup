const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const mockupDir = path.join(uploadDir, 'mockups');
const userImagesDir = path.join(uploadDir, 'user-images');

// Ensure directories exist
[uploadDir, mockupDir, userImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the destination folder based on the route
    const isUserImage = req.path.includes('user-image');
    const destFolder = isUserImage ? userImagesDir : mockupDir;
    cb(null, destFolder);
  },
  filename: function (req, file, cb) {
    // For mockups, use the specified number if provided, otherwise use timestamp
    if (req.path.includes('mockup') && req.body.mockupNumber) {
      cb(null, `${req.body.mockupNumber}.png`);
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone są tylko pliki graficzne!'), false);
  }
};

// Setup the multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Enable JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint to upload a user image
app.post('/api/upload/user-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nie przesłano pliku' });
  }
  
  // Return the file path
  res.json({ 
    success: true, 
    filePath: `/uploads/user-images/${req.file.filename}` 
  });
});

// API endpoint to upload mockups
app.post('/api/upload/mockup', upload.single('mockup'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nie przesłano pliku' });
  }
  
  // Return the file path
  res.json({ 
    success: true, 
    filePath: `/uploads/mockups/${req.file.filename}`,
    mockupNumber: req.body.mockupNumber || null
  });
});

// API endpoint to get available mockups
app.get('/api/mockups', (req, res) => {
  try {
    const mockups = [];
    
    // Read the mockups directory
    const files = fs.readdirSync(mockupDir);
    
    // Process each file
    files.forEach(file => {
      if (file.endsWith('.png')) {
        const filePath = `/uploads/mockups/${file}`;
        const fileNameWithoutExt = path.basename(file, '.png');
        const id = parseInt(fileNameWithoutExt, 10) || files.indexOf(file) + 1;
        
        mockups.push({
          id: id,
          path: filePath,
          fileName: file
        });
      }
    });
    
    // Sort mockups by ID
    mockups.sort((a, b) => a.id - b.id);
    
    res.json({ success: true, mockups });
  } catch (error) {
    console.error('Error reading mockups directory:', error);
    res.status(500).json({ error: 'Błąd odczytu mockupów' });
  }
});

// API endpoint to delete a mockup
app.delete('/api/mockups/:id', (req, res) => {
  try {
    const mockupId = req.params.id;
    const mockupPath = path.join(mockupDir, `${mockupId}.png`);
    
    // Check if file exists
    if (fs.existsSync(mockupPath)) {
      // Delete the file
      fs.unlinkSync(mockupPath);
      res.json({ success: true, message: 'Mockup usunięty pomyślnie' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono mockupu' });
    }
  } catch (error) {
    console.error('Error deleting mockup:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania mockupu' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});