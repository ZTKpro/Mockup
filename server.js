const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, "uploads");
const mockupDir = path.join(uploadDir, "mockups");
const userImagesDir = path.join(uploadDir, "user-images");

// Ensure directories exist
[uploadDir, mockupDir, userImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage for mockups (saved to disk)
const mockupStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mockupDir);
  },
  filename: function (req, file, cb) {
    const mockupNumber = req.body.mockupNumber || Date.now();
    // Sanitize mockup name: replace spaces with underscores and remove special characters
    const mockupName = req.body.mockupName
      ? req.body.mockupName
          .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s_-]/g, "")
          .replace(/\s+/g, "_")
      : "mockup";

    cb(null, `${mockupNumber}_${mockupName}.png`);
  },
});

// Memory storage for user images (not saved to disk)
const userImageStorage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Dozwolone są tylko pliki graficzne!"), false);
  }
};

// Setup the multer uploads with different configurations
const uploadMockup = multer({
  storage: mockupStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const uploadUserImage = multer({
  storage: userImageStorage, // Using memory storage for user images
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Enable JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API endpoint to upload a user image - now using memory storage
app.post(
  "/api/upload/user-image",
  uploadUserImage.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nie przesłano pliku" });
    }

    // Convert the buffer to base64 data URL
    const fileExtension =
      path.extname(req.file.originalname).substring(1) || "png";
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Return the base64 data URL instead of a file path
    res.json({
      success: true,
      imageData: base64Image,
      // No filePath since we're not saving to disk
    });
  }
);

// API endpoint to upload mockups - these are still saved to disk
app.post("/api/upload/mockup", uploadMockup.single("mockup"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nie przesłano pliku" });
  }

  // Return the file path and additional info
  res.json({
    success: true,
    filePath: `/uploads/mockups/${req.file.filename}`,
    mockupNumber: req.body.mockupNumber || null,
    mockupName: req.body.mockupName || "mockup",
  });
});

// API endpoint to get available mockups
app.get("/api/mockups", (req, res) => {
  try {
    const mockups = [];

    // Read the mockups directory
    const files = fs.readdirSync(mockupDir);

    // Process each file
    files.forEach((file) => {
      if (file.endsWith(".png")) {
        const filePath = `/uploads/mockups/${file}`;

        // Extract ID and name from the filename
        // Format: "id_name.png" or just "id.png" for older files
        let id, name;

        if (file.includes("_")) {
          // New format: id_name.png
          const parts = path.basename(file, ".png").split("_");
          id = parseInt(parts[0], 10) || files.indexOf(file) + 1;
          name = parts.slice(1).join("_").replace(/_/g, " "); // Convert underscores back to spaces for display
        } else {
          // Old format: id.png
          const fileNameWithoutExt = path.basename(file, ".png");
          id = parseInt(fileNameWithoutExt, 10) || files.indexOf(file) + 1;
          name = `Mockup ${id}`; // Default name for backward compatibility
        }

        mockups.push({
          id: id,
          name: name,
          path: filePath,
          fileName: file,
        });
      }
    });

    // Sort mockups by ID
    mockups.sort((a, b) => a.id - b.id);

    res.json({ success: true, mockups });
  } catch (error) {
    console.error("Error reading mockups directory:", error);
    res.status(500).json({ error: "Błąd odczytu mockupów" });
  }
});

app.delete("/api/mockups/:id", (req, res) => {
  try {
    const mockupId = parseInt(req.params.id, 10);

    // Read the mockups directory to find the file with matching ID
    const files = fs.readdirSync(mockupDir);
    let mockupFile = null;

    // Find the file with the matching ID
    for (const file of files) {
      if (file.endsWith(".png")) {
        let id;

        if (file.includes("_")) {
          // New format: id_name.png
          id = parseInt(file.split("_")[0], 10);
        } else {
          // Old format: id.png
          id = parseInt(path.basename(file, ".png"), 10);
        }

        // If parsing fails, fall back to index
        if (isNaN(id)) {
          id = files.indexOf(file) + 1;
        }

        if (id === mockupId) {
          mockupFile = file;
          break;
        }
      }
    }

    if (mockupFile) {
      const mockupPath = path.join(mockupDir, mockupFile);

      // Delete the file
      fs.unlinkSync(mockupPath);
      res.json({ success: true, message: "Mockup usunięty pomyślnie" });
    } else {
      res.status(404).json({ error: "Nie znaleziono mockupu" });
    }
  } catch (error) {
    console.error("Error deleting mockup:", error);
    res.status(500).json({ error: "Błąd podczas usuwania mockupu" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}  http://localhost:${PORT}/`);
});
