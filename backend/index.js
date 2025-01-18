const express = require("express");
const connectDb = require("./db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const htmlToPdf = require("html-pdf");
const attendanceController = require("./Controllers/AttendanceController");
const dotenv = require("dotenv");
dotenv.config();
const employeeRoutes = require("./Routes/EmployeeRoute");
const attendanceRoutes = require("./Routes/AttendanceRouter");
const payRunCalcRoutes = require("./Routes/PayRunCalcRoute");
const TempEmployeeRoutes = require("./Routes/TempEmployeeRouter");
const payrollRoutes = require("./Routes/PayRollRoutes");
const holidayRoutes = require("./Routes/HolidayRouter");
const authRoutes = require("./Routes/authRoutes");
const roleRoutes = require("./Routes/RolesRoute");
const bodyParser = require("body-parser");

const app = express();
// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));

const port = 4000;
connectDb();

// Serve static files from the 'uploads/images' directory
app.use(
  "/uploads/images",
  express.static(path.join(__dirname, "uploads", "images"))
);
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads", "images");

    // Check if the directory exists, if not, create it
    if (!fs.existsSync(uploadPath)) {
      await fs.mkdirp(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: async (req, file, cb) => {
    const { employeeId, additionalText } = req.body;
    //console.log("Inside multer filename function:", employeeId, additionalText);

    const fileBaseName = `${employeeId}-${additionalText}`;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileBaseName}${fileExtension}`;

    const uploadPath = path.join(__dirname, "uploads", "images");

    try {
      // Get all files in the directory
      const files = await fs.readdir(uploadPath);

      // Find and delete files with the same base name but different extensions
      files.forEach(async (existingFile) => {
        if (existingFile.startsWith(fileBaseName)) {
          await fs.remove(path.join(uploadPath, existingFile));
        }
      });

      // Once old files are deleted, proceed with saving the new file
      cb(null, fileName);
    } catch (err) {
      console.error("Error checking existing files:", err);
      cb(err);
    }
  },
});

const upload = multer({ storage }).fields([
  { name: "file", maxCount: 1 },
  { name: "employeeId" },
  { name: "additionalText" },
]);

// Route to handle file upload
app.post("/v1/api/upload", upload, (req, res) => {
  // console.log("Request body:", req.body); // Now you should see the form data here
  // console.log("Request files:", req.files); // Files are in req.files

  if (!req.files.file) {
    return res.status(400).send("No file uploaded.");
  }

  const fileUrl = `/uploads/images/${req.files.file[0].filename}`;
  res.send({
    message: "File uploaded successfully",
    fileName: req.files.file[0].filename,
    url: fileUrl,
  });
});

// Body parsers should be applied after multer middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Employee and Attendance routes
app.use("/v1/api/employees", employeeRoutes);
app.use("/v1/api/attendance", attendanceRoutes);
app.use("/v1/api/payruncalc", payRunCalcRoutes);
app.use("/v1/api/tempEmployee", TempEmployeeRoutes);
app.use("/v1/api/payroll", payrollRoutes);
app.use("/v1/api/holiday", holidayRoutes);
//role-based authentication

app.use("/v1/api/auth", authRoutes);
app.use("/v1/api/role", roleRoutes);

// Cron job to initialize daily attendance at midnight
cron.schedule("0 0 * * *", () => {
  attendanceController.createDailyAttendance();
  console.log("Daily attendance initialized at midnight");
});
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
