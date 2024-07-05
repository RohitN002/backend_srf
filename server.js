const express = require('express');
const multer = require('multer');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');
const dotenv = require('dotenv')
dotenv.config()

const Port = process.env.PORT
const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connection = mysql.createConnection({
 
port :3306,
host:'bykfq6ntpibxgjvkx9py-mysql.services.clever-cloud.com',
user: 'uzcg3wsd4vvplpdc',
password: 'R5J9Svp4uTnDcH4M7QbK', // Replace with your MySQL password
database: 'bykfq6ntpibxgjvkx9py' // Replace with your database name
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL'); })
// });
// const createUsersTable = `
//     CREATE TABLE IF NOT EXISTS students (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       studentName VARCHAR(255),
//       dob DATE,
//       fatherName VARCHAR(255),
//       mobileNumber VARCHAR(20),
//       collegeName VARCHAR(255),
//       courseDetails VARCHAR(50),
//       areaOfInterest VARCHAR(255),
//       programmingSkills VARCHAR(255),
//       address TEXT,
//       yearOfPassingOut YEAR,
//       email VARCHAR(255),
//       resume VARCHAR(255)
//     );
//   `;

//   connection.query(createUsersTable, (err, result) => {
//     if (err) throw err;
//     console.log('Table created or already exists.');
//   });


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
// Endpoint to view resumes
app.get('/view-resume/:path', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.path);
  res.sendFile(filePath);
});

// Endpoint to register students
app.post('/register', upload.single('resume'), (req, res) => {
  const { studentName, dob, fatherName, mobileNumber, collegeName, courseDetails, areaOfInterest, programmingSkills, address, yearOfPassingOut, email } = req.body;
  const resume = req.file.path;

  const query = 'INSERT INTO students (studentName, dob, fatherName, mobileNumber, collegeName, courseDetails, areaOfInterest, programmingSkills, address, yearOfPassingOut, email, resume) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  connection.query(query, [studentName, dob, fatherName, mobileNumber, collegeName, courseDetails, areaOfInterest.join(','), programmingSkills.join(','), address, yearOfPassingOut, email, resume], (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.status(200).json({ message: 'Registration successful' });
  });
});

// Endpoint to fetch all students
app.get('/students', (req, res) => {
  const query = 'SELECT * FROM students';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from MySQL:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.status(200).json(results);
  });
});
app.get('/api/download-pdf/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);

    // Check if the resume file exists
    if (fs.existsSync(filePath)) {
        // Create a new PDF document
        const pdfDoc = new PDFDocument();

        // Set content disposition to force download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${req.params.filename.replace(/\.[^/.]+$/, "")}.pdf`);

        // Pipe the PDF document to the response
        pdfDoc.pipe(res);

        // Embed resume content in PDF
        pdfDoc.fontSize(12).text(`Resume: ${req.params.filename}`, {
            align: 'center'
        });

        // Read resume file and embed it in PDF
        const resumeContent = fs.readFileSync(filePath);
        pdfDoc.image(resumeContent, {
            fit: [250, 300],
            align: 'center',
            valign: 'center'
        });

        // Finalize PDF and end the response
        pdfDoc.end();
    } else {
        console.error('Resume file not found:', req.params.filename);
        res.status(404).json({ error: 'Resume file not found' });
    }
});

app.listen(Port, () => {
  console.log('Server running on port 5000');
});
