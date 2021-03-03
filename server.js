const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { default: axios } = require("axios");

require("dotenv").config();

const app = express();

// Constants
const PORT = process.env.PORT;
const MLFLOW_UI_BASE_URL = process.env.MLFLOW_UI_BASE_URL;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MLFLOW UI endpoints
app.get("/list-models", async (req, res) => {
  let data;
  try {
    data = await axios.get(
      `${MLFLOW_UI_BASE_URL}/api/2.0/preview/mlflow/registered-models/list`
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  return res.json(data);
});

// Deployment endpoints
app.get("/deploy-docker", async (req, res) => {
  return res.json("hi");
});

app.get("/deploy-ecs", async (req, res) => {
  return res.json("hi");
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
