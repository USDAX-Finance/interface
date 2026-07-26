import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting — prevents spam/abuse on write endpoints
const writeLimiter = rateLimit({
  windowMs: 60_000,       // 1 minute window
  max: 30,                // max 30 write requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
  skip: (req) => req.method === "GET" || req.method === "HEAD",
});

const readLimiter = rateLimit({
  windowMs: 60_000,       // 1 minute window
  max: 300,               // max 300 reads per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
});

app.use("/api", readLimiter);
app.use("/api/positions", writeLimiter);

app.use("/api", router);

export default app;
