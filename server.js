const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

require("dotenv").config();

const app = express();

// Constants
const PORT = process.env.PORT;
const MLFLOW_UI_BASE_URL = process.env.MLFLOW_UI_BASE_URL;
const MICROSERVICE_ENDPOINT = process.env.MICROSERVICE_ENDPOINT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MLFLOW UI endpoint
// This endpoint will query the data of the registered models
// using the "MLFLOW_UI_BASE_URL" that is provided
// as the location of the MLFLOW Server
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

const { deploy } = require("./deploy-ec2");
const { describeInstances } = require("./ec2");
//const MICROSERVICE_ENDPOINT =
//  "http://ec2-3-235-5-18.compute-1.amazonaws.com:8000/docker";


// This endpoint is hit when the front end selects "Deploy Hosted on EC2"
// This function sends a request to another server to create a
//    docker image of an ML model and push it to AWS ECR
// Parameters:
//    artifactLocation: The S3 bucket where the artifacts are stored for the ML MODEL
//    ecrURL: The URL for the ecr registry where the docker image will be stored
//    name: The name to be used for the ecr repository as well as the docker image
//        NOTE: a timestamp is added to the name variable to make it unique
//
//
//  NOTE: This function sends work out to another server to be done.  When the other
//        server finishes its work, it will send back a request to the "/deploy-webhook"
//        endpoint on this server to finish out the deployment task
app.post("/deploy-ec2", async (req, res) => {
  const { artifactLocation, ecrURL, name } = req.body;

   let uniqueName = name + Date.now(); // Append Date.now() to make the name unique
   console.log(name);
   uniqueName = uniqueName.replace(/ /g,"_");
   console.log("Name:");
   console.log(uniqueName);
   console.log("ART:");
   console.log(artifactLocation);

  // Call service to build image and push to ECR
  try {
     const { data } = await axios.post(MICROSERVICE_ENDPOINT, {
       artifactLocation: artifactLocation,
       ecrURL: ecrURL,
       name: uniqueName,
     });
  } catch (e) {
    console.log(e);
    return res.sendStatus(500);
  }

  return res.json({ message: "Success! EC2 Is being prepared." });
});


// This endpoint is hit when a docker image on an ML Model has been pushed to ECR
// This function will create an ec2 instance and pass in a script which will
//    run the ML Model contained in the docker image at the ECR URL (repository)
// Parameters:
//    ecrUrl: The URL of the ecr registry
//    name: the name of the ecr repository as well as the name of the docker image
app.post("/deploy-webhook", async (req, res) => {
  const { ecrUrl, name } = req.body;
  var validatedEcrUrl = ecrUrl;

  if (ecrUrl.charAt(ecrUrl.length - 1) === '/') {
    validatedEcrUrl = ecrUrl.slice(0, ecrUrl.length - 1);
  }

  // Create instance
  try {
    await deploy({ validatedEcrUrl, name });
    console.log("worked!");
  } catch (e) {
    console.log("failed");
    console.log(e);
    return res.sendStatus(500);
  }
});


// This endpoint is used to query the data of the EC2 instances that are currently
// hosting a deployed mlModel.  When the models are created using the "deploy-ec2" endpoint,
// They are tagged with
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


// This is the current solution we have for querying a deployed model
// It's only purpose it to get around CORS errors when trying to
// query a deployed model from the frontend.  It simply passes on a post request
// and returns the response.
app.post("/query-model", async (req, res) => {
  const { url, payload } = req.body;
  console.log("Request");
  console.log(req.body);
  console.log("url, payload");
  console.log(url);
  console.log(payload);

  let response;

  try {
    console.log("Before");
    response = await axios.post(url, payload, { headers: {
          "Content-Type": "application/json",
          format: "pandas-split",
          }});
    console.log(response);
    console.log(response.data);
  }
  catch(err) {
    console.log("Error message:");
    console.log(err);
    return res.status(500).send(err)
  }

  return res.json(response.data);
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
