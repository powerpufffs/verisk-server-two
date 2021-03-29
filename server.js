const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

require("dotenv").config();

const app = express();

// Constants
const PORT = process.env.PORT;
const MLFLOW_UI_BASE_URL = process.env.MLFLOW_UI_BASE_URL;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MLFLOW UI endpoints
app.get("/list-registered-models", async (req, res) => {
  let response;
  try {
    const { data } = await axios.get(
      `http://${MLFLOW_UI_BASE_URL}/api/2.0/preview/mlflow/registered-models/list`
    );
    response = data;
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  console.log("success");
  return res.send(response);
});

var Docker = require("dockerode");
const aws = require("aws-sdk");
const exec = require("child_process").exec;

// Deployment endpoints
app.get("/deploy-docker", async (req, res) => {
  const { artifactLocation } = req.params;

  // execute script
  const result = await exec("echo 'AMAZING'");

  return res.json({ result });
});

app.get("/deploy-ecs", async (req, res) => {
  return res.json("hi");
});

const { deploy } = require("./deploy-ec2");
const { describeInstances } = require("./ec2");
const MICROSERVICE_ENDPOINT =
  "http://ec2-3-235-5-18.compute-1.amazonaws.com:8000/docker";

app.post("/deploy-ec2", async (req, res) => {
  //const { artifactLocation, ecrURL, name } = req.params;
  console.log("Request Parameters:");
  console.log(req.params);
   const { artifactLocation, ecrURL, name } = {
     artifactLocation: "s3://verisk-trial/models/0/942a0174d2f54888a23dc9269d98d69c/artifacts/model/",
     ecrURL: "383367762271.dkr.ecr.us-east-1.amazonaws.com",
     name: "d_test6",
   };

  // Call service to build image and push to ECR
  try {
     const { data } = await axios.post(MICROSERVICE_ENDPOINT, {
       artifactLocation: artifactLocation,
       ecrURL: ecrURL,
       name: name,
     });
  } catch (e) {
    console.log(e);
    return res.sendStatus(500);
  }

  // Create instance
//  try {
//    await deploy({ ecrURL, name });
//    console.log("worked!");
//  } catch (e) {
//    console.log("failed");
//    console.log(e);
//    return res.sendStatus(500);
//  }

  // res.json({ publicDNS: `${dns}:8080/invocations` });
  return res.json({ message: "Success! EC2 Is being prepared." });
});

app.post("/deploy-webhook", async (req, res) => {
  const { ecrUrl, name } = req.body;
  console.log("Request, ecr, name");
  console.log(req.body)
  console.log(ecrUrl);
  console.log(name);

  // Create instance
  try {
    //ecrURL = "383367762271.dkr.ecr.us-east-1.amazonaws.com";
    //name = "d_test4";
    await deploy({ ecrUrl;, name });
    console.log("worked!");
  } catch (e) {
    console.log("failed");
    console.log(e);
    return res.sendStatus(500);
  }
});

app.get("/live-endpoints", async (req, res) => {
  const response = await describeInstances({ filterId: "EC2_LIVE" });

  const reservations = response.Reservations;
  const instances = reservations.map((reservation) => {
    const { Instances } = reservation;
    const { PublicDnsName, Tags } = Instances[0];
    const { Value } = Tags.find((x) => x.Key === "deployId");
    return {
      dns: `${PublicDnsName}:8080/invocations`,
      id: Value,
    };
  });

  return res.json(instances);
});

// For the demo
// MLFLOW MODEL TEST endpoints
app.post("/test-endpoint", async (req, res) => {
  const params = req.body;

  let response;
  try {
    response = await axios.post(
      `http://ec2-3-235-5-18.compute-1.amazonaws.com:8080/invocations`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
          format: "pandas-split",
        },
      }
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.json(response.data);
});

app.post("/alive", async (req, res) => {});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
