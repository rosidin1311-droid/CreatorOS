import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_, res) => {
  res.json({
    app: "CreatorOS Backend",
    version: "0.11.0",
    status: "online"
  });
});

export default app;