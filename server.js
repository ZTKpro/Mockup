const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, "uploads");
const mockupDir = path.join(uploadDir, "mockups");

// Ensure directories exist
[uploadDir, mockupDir].forEach((dir) => {
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
    const mockupModel = req.body.mockupModel
      ? req.body.mockupModel
          .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s_-]/g, "")
          .replace(/\s+/g, "_")
      : "Inne";

    cb(null, `${mockupNumber}_${mockupModel}.png`);
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

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// API endpoint to upload mockups - these are still saved to disk
app.post("/api/upload/mockup", upload.single("mockup"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nie przesłano pliku" });
  }

  // Now we have access to all form fields
  const mockupNumber = req.body.mockupNumber || Date.now();
  const mockupModel = req.body.mockupModel
    ? req.body.mockupModel
        .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s_-]/g, "")
        .replace(/\s+/g, "_")
    : "Inne";

  // Simplified filename format: number_model.png
  const filename = `${mockupNumber}_${mockupModel}.png`;
  const filepath = path.join(mockupDir, filename);

  // Write the file from memory to disk
  fs.writeFile(filepath, req.file.buffer, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).json({ error: "Błąd zapisywania pliku" });
    }

    // Return success response
    res.json({
      success: true,
      filePath: `/uploads/mockups/${filename}`,
      mockupNumber: mockupNumber,
      mockupName: mockupModel, // Use model as name for backward compatibility
      mockupModel: mockupModel,
    });
  });
});

// API endpoint to get available mockups
app.get("/api/mockups", (req, res) => {
  try {
    const mockups = [];
    const files = fs.readdirSync(mockupDir);

    files.forEach((file) => {
      if (file.endsWith(".png")) {
        const filePath = `/uploads/mockups/${file}`;
        let id,
          model = "Inne"; // Default model for backward compatibility

        if (file.includes("_")) {
          const parts = path.basename(file, ".png").split("_");
          id = parseInt(parts[0], 10) || files.indexOf(file) + 1;

          // New parsing logic: everything after the first underscore is the model
          model = parts.slice(1).join("_").replace(/_/g, " ");
        } else {
          // Very old format: id.png
          const fileNameWithoutExt = path.basename(file, ".png");
          id = parseInt(fileNameWithoutExt, 10) || files.indexOf(file) + 1;
        }

        mockups.push({
          id: id,
          name: model, // Use model as name for display purposes
          model: model,
          path: filePath,
          fileName: file,
        });
      }
    });

    mockups.sort((a, b) => a.id - b.id);
    res.json({ success: true, mockups });
  } catch (error) {
    console.error("Error reading mockups directory:", error);
    res.status(500).json({ error: "Błąd odczytu mockupów" });
  }
});

app.get("/api/models", (req, res) => {
  try {
    const models = new Set();
    const files = fs.readdirSync(mockupDir);

    files.forEach((file) => {
      if (file.endsWith(".png")) {
        let model = "Inne"; // Default model

        if (file.includes("_")) {
          const parts = path.basename(file, ".png").split("_");
          if (parts.length >= 3) {
            // New format with model: id_model_name.png
            // MODIFIED: Replace underscores with spaces for display
            model = parts[1].replace(/_/g, " ");
          }
        }

        models.add(model);
      }
    });

    res.json({ success: true, models: Array.from(models).sort() });
  } catch (error) {
    console.error("Error reading models:", error);
    res.status(500).json({ error: "Błąd odczytu modeli" });
  }
});

app.put("/api/mockups/:id/model", express.json(), (req, res) => {
  try {
    const mockupId = parseInt(req.params.id, 10);
    const newModel = req.body.model;

    if (!newModel) {
      return res.status(400).json({ error: "Model nie został podany" });
    }

    // Sanitize model name but preserve spaces for display
    const sanitizedModel = newModel
      .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s_-]/g, "")
      .trim();

    // For filename, replace spaces with underscores
    const filenameModel = sanitizedModel.replace(/\s+/g, "_");

    // Find the mockup file
    const files = fs.readdirSync(mockupDir);
    let mockupFile = null;

    console.log(`Looking for mockup ID: ${mockupId}`);

    for (const file of files) {
      if (file.endsWith(".png")) {
        let id;

        try {
          if (file.includes("_")) {
            // Try to parse ID from the part before first underscore
            id = parseInt(file.split("_")[0], 10);
          } else {
            // For files without underscore, use the filename as ID
            id = parseInt(path.basename(file, ".png"), 10);
          }

          if (id === mockupId) {
            mockupFile = file;
            break;
          }
        } catch (parseError) {
          console.error(`Error parsing ID from filename ${file}:`, parseError);
          // Continue to next file if parsing fails
          continue;
        }
      }
    }

    if (!mockupFile) {
      return res.status(404).json({
        error: "Nie znaleziono mockupu",
        mockupId: mockupId,
      });
    }

    console.log(`Found mockup file: ${mockupFile}`);

    // For simplicity and reliability, use the exact ID from the request
    // and append new model name, regardless of original filename format
    const newFileName = `${mockupId}_${filenameModel}.png`;

    console.log(`Renaming ${mockupFile} to ${newFileName}`);

    // Rename the file
    fs.renameSync(
      path.join(mockupDir, mockupFile),
      path.join(mockupDir, newFileName)
    );

    res.json({
      success: true,
      message: "Model mockupu zaktualizowany",
      newFileName: newFileName,
    });
  } catch (error) {
    console.error("Error updating mockup model:", error);
    res.status(500).json({
      error: "Błąd aktualizacji modelu mockupu",
      message: error.message,
    });
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
