const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 9000;

// Setup multer for file upload handling
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static('public'));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const getFileSize = (filePath) => {
  return fs.statSync(filePath).size;
};

const compressPDF = (inputPath, outputPath) => {
  try {
    // Get initial file size
    const originalSize = getFileSize(inputPath);

    // Properly escape file paths with spaces
    const escapedInputPath = `"${inputPath}"`;
    const escapedOutputPath = `"${outputPath}"`;

    // Ghostscript command for high compression
    const gsCommand = [
      'gs', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/prepress', '-dNOPAUSE', '-dQUIET', '-dBATCH',
      '-dDownsampleColorImages=true', '-dColorImageResolution=72',
      '-dDownsampleGrayImages=true', '-dGrayImageResolution=72',
      '-dDownsampleMonoImages=true', '-dMonoImageResolution=72',
      '-sOutputFile=' + escapedOutputPath, escapedInputPath
    ].join(' ');

    // Run Ghostscript command
    execSync(gsCommand);

    // Get the compressed file size
    const compressedSize = getFileSize(outputPath);

    // Calculate and return compression ratio
    const compressionRatio = originalSize > 0 ? (compressedSize / originalSize) * 100 : 0;

    return {
      compressedFilePath: outputPath,
      originalSize: originalSize,
      compressedSize: compressedSize,
      compressionRatio: compressionRatio
    };
  } catch (error) {
    throw new Error('Error compressing PDF: ' + error.message);
  }
};

app.post('/compress', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = path.join(__dirname, req.file.path);
  const outputPath = path.join(__dirname, 'uploads', 'compressed_' + req.file.originalname);

  try {
    const result = compressPDF(inputPath, outputPath);

    // Set headers to prompt a download
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(outputPath)}`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the compressed file to the response
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Clean up files after streaming
    fileStream.on('end', () => {
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError);
      }
    });

    // Handle errors during file streaming
    fileStream.on('error', (streamError) => {
      console.error('Error streaming file:', streamError);
      res.status(500).json({ error: 'Error streaming file' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
