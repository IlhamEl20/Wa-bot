import winston from "winston";
import path from "path";
import fs from "fs";
import "winston-daily-rotate-file";
import { fileURLToPath } from "url";

// Mendapatkan __filename dan __dirname dalam modul ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path ke direktori logs
const logDirectory = path.join(__dirname, "../logs");

// Konfigurasi daily rotate file transport
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDirectory, "application-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m", // Ukuran maksimum file log sebelum rotasi
  maxFiles: "3d", // Menyimpan log selama 7 hari
});

// Menangani kesalahan logging
dailyRotateFileTransport.on("error", function (err) {
  console.error("Error occurred in logging:", err);
});

// Membuat logger dengan winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "message-service" },
  transports: [
    dailyRotateFileTransport,
    new winston.transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

export default logger;
