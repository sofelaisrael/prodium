const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  "https://prodium.vercel.app",
  "https://prodmin.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use((req, res, next) => {
  if (req.path === "/api/upload") return next();
  express.json({ limit: "10mb" })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

const MAX_UPLOAD = 4 * 1024 * 1024;

app.post('/api/upload', async (req, res) => {
  try {
    console.log("Content-Type:", req.headers['content-type']);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);

    const buffer = Buffer.concat(chunks);
    console.log("Buffer size:", buffer.length);

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No file data received' });
    }

    if (buffer.length > MAX_UPLOAD) {
      return res.status(413).json({ error: 'File too large.' });
    }

    console.log("OK");
    res.json({ url: 'test', filename: 'test.jpg', mimetype: req.headers['content-type'] });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

app.listen(3999, () => console.log('ready'));
