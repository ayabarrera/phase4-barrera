// server.js
import express from 'express';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import http from 'http';
import userRouter from './routes/user.js';
import fileRouter from './routes/file.js';
import commentRouter from './routes/comment.js';
import cors from 'cors';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp'; // Prevent HTTP Parameter Pollution

configDotenv();

const app = express();
app.use(express.json({ limit: '10kb' })); // Limit JSON body size to avoid DoS

// 1️⃣ Security Headers
app.use(helmet());

// 2️⃣ Content Security Policy (CSP) to prevent XSS & data injection
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], 
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "ws:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  })
);

// 3️⃣ Prevent XSS Attacks
app.use(xss());

// 4️⃣ Prevent NoSQL Injection
app.use(mongoSanitize());

// 5️⃣ Prevent HTTP Parameter Pollution
app.use(hpp());

// 6️⃣ CORS Configuration (Restrict allowed origins)
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 7️⃣ Rate Limiting (Prevent brute-force attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);


app.use('/user', userRouter);
app.use('/file', fileRouter);
app.use('/comment', commentRouter);


const server = http.createServer(app);

console.log(`Connecting to database: ${process.env.DB_URL}/${process.env.DATABASE_NAME}`);

mongoose
  .connect(`${process.env.DB_URL}/${process.env.DATABASE_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(3000, () => {
      console.log('✅ Server started at port 3000');
    });
  })
  .catch((err) => {
    console.error(`❌ ERROR: ${err}`);
  });
