const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Sprawdź, czy aplikacja jest uruchomiona w trybie debugowania
const isDebugMode = process.argv.includes('--debug');

if (isDebugMode) {
  console.log('====================================');
  console.log('Uruchomiono serwer w trybie debugowania');
  console.log('====================================');
}

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, "uploads");
const mockupDir = path.join(uploadDir, "mockups");

// Ensure directories exist
[uploadDir, mockupDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    if (isDebugMode) console.log(`Tworzenie katalogu: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage for mockups (saved to disk)
const mockupStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (isDebugMode) console.log(`Zapisywanie mockupu do: ${mockupDir}`);
    cb(null, mockupDir);
  },
  filename: function (req, file, cb) {
    const mockupNumber = req.body.mockupNumber || Date.now();
    const mockupModel = req.body.mockupModel
      ? req.body.mockupModel
          .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s_-]/g, "")
          .replace(/\s+/g, "_")
      : "Inne";

    const filename = `${mockupNumber}_${mockupModel}.png`;
    if (isDebugMode) console.log(`Generowanie nazwy pliku mockupu: ${filename}`);
    cb(null, filename);
  },
});

// Memory storage for user images (not saved to disk)
const userImageStorage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    if (isDebugMode) console.log(`Zaakceptowano plik: ${file.originalname}, typ: ${file.mimetype}`);
    cb(null, true);
  } else {
    if (isDebugMode) console.log(`Odrzucono plik: ${file.originalname}, typ: ${file.mimetype}`);
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

// Dodaj middleware do logowania zapytań w trybie debugowania
if (isDebugMode) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

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
      if (isDebugMode) console.log("Błąd: Nie przesłano pliku obrazu użytkownika");
      return res.status(400).json({ error: "Nie przesłano pliku" });
    }

    // Convert the buffer to base64 data URL
    const fileExtension =
      path.extname(req.file.originalname).substring(1) || "png";
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    if (isDebugMode) console.log(`Obraz użytkownika przekonwertowany do base64, rozmiar: ${req.file.size} bajtów`);

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
    if (isDebugMode) console.log("Błąd: Nie przesłano pliku mockupu");
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

  if (isDebugMode) console.log(`Zapisywanie mockupu: ${filename}, rozmiar: ${req.file.size} bajtów`);

  // Write the file from memory to disk
  fs.writeFile(filepath, req.file.buffer, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      if (isDebugMode) console.log(`Błąd zapisywania mockupu: ${err.message}`);
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

    if (isDebugMode) console.log(`Wczytywanie mockupów, znaleziono ${files.length} plików`);

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
        
        if (isDebugMode) console.log(`Znaleziono mockup: ID=${id}, Model=${model}, Plik=${file}`);
      }
    });

    mockups.sort((a, b) => a.id - b.id);
    res.json({ success: true, mockups });
  } catch (error) {
    console.error("Error reading mockups directory:", error);
    if (isDebugMode) console.log(`Błąd odczytu katalogu mockupów: ${error.message}`);
    res.status(500).json({ error: "Błąd odczytu mockupów" });
  }
});

app.get("/api/models", (req, res) => {
  try {
    const models = new Set();
    const files = fs.readdirSync(mockupDir);

    if (isDebugMode) console.log(`Wczytywanie modeli z ${files.length} plików`);

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

    if (isDebugMode) console.log(`Znaleziono modele: ${Array.from(models).join(', ')}`);
    
    res.json({ success: true, models: Array.from(models).sort() });
  } catch (error) {
    console.error("Error reading models:", error);
    if (isDebugMode) console.log(`Błąd odczytu modeli: ${error.message}`);
    res.status(500).json({ error: "Błąd odczytu modeli" });
  }
});

app.put("/api/mockups/:id/model", express.json(), (req, res) => {
  try {
    const mockupId = parseInt(req.params.id, 10);
    const newModel = req.body.model;

    if (isDebugMode) console.log(`Aktualizacja modelu mockupu ID=${mockupId} na "${newModel}"`);

    if (!newModel) {
      if (isDebugMode) console.log(`Błąd: Nie podano modelu dla mockupu ID=${mockupId}`);
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
    if (isDebugMode) console.log(`Szukanie pliku mockupu ID=${mockupId}`);

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
            if (isDebugMode) console.log(`Znaleziono plik mockupu: ${file} dla ID=${mockupId}`);
            break;
          }
        } catch (parseError) {
          console.error(`Error parsing ID from filename ${file}:`, parseError);
          if (isDebugMode) console.log(`Błąd parsowania ID z nazwy pliku ${file}: ${parseError.message}`);
          // Continue to next file if parsing fails
          continue;
        }
      }
    }

    if (!mockupFile) {
      if (isDebugMode) console.log(`Nie znaleziono mockupu o ID=${mockupId}`);
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
    if (isDebugMode) console.log(`Zmiana nazwy pliku z ${mockupFile} na ${newFileName}`);

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
    if (isDebugMode) console.log(`Błąd aktualizacji modelu mockupu: ${error.message}`);
    res.status(500).json({
      error: "Błąd aktualizacji modelu mockupu",
      message: error.message,
    });
  }
});

app.delete("/api/mockups/:id", (req, res) => {
  try {
    const mockupId = parseInt(req.params.id, 10);
    
    if (isDebugMode) console.log(`Usuwanie mockupu ID=${mockupId}`);

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
          if (isDebugMode) console.log(`Znaleziono plik mockupu do usunięcia: ${file}`);
          break;
        }
      }
    }

    if (mockupFile) {
      const mockupPath = path.join(mockupDir, mockupFile);

      // Delete the file
      fs.unlinkSync(mockupPath);
      if (isDebugMode) console.log(`Usunięto plik mockupu: ${mockupPath}`);
      res.json({ success: true, message: "Mockup usunięty pomyślnie" });
    } else {
      if (isDebugMode) console.log(`Nie znaleziono mockupu o ID=${mockupId}`);
      res.status(404).json({ error: "Nie znaleziono mockupu" });
    }
  } catch (error) {
    console.error("Error deleting mockup:", error);
    if (isDebugMode) console.log(`Błąd podczas usuwania mockupu: ${error.message}`);
    res.status(500).json({ error: "Błąd podczas usuwania mockupu" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}  http://localhost:${PORT}/`);
  if (isDebugMode) {
    console.log("============================================");
    console.log(`Serwer uruchomiony w trybie DEBUG na porcie ${PORT}`);
    console.log(`http://localhost:${PORT}/?debug=true`);
    console.log("============================================");
  }
});