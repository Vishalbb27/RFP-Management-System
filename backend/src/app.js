const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "10mb" }));

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
