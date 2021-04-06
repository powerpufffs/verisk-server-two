// This file is used to deploy an MlModel on an EC2

const {
  describeInstances,
  createInstance,
  terminateInstance,
} = require("./ec2");

// This function is used to create an EC2 instance, tag it, and pass it a script
// to be run once the EC2 is up an running.
//
// NOTE: The two tags given to the EC2 are a group tag and a unique tag respectively:
//    Key: "ec2GroupId"; Value: "EC2_LIVE"
//    Key: "deployId"; Value: id;
//
// Calls: generateScript (see below)
//        createInstance (see ec2.js)
const deploy = async ({ validatedEcrUrl, name }) => {
  const generator = idGenerator();
  let lowerCaseName = name.toLowerCase();
  const base64Script = generateScript(validatedEcrUrl, lowerCaseName);
  //const id = generator().toString();
  const id = name;

  return createInstance({
    imageId: "ami-042e8287309f5df03",
    count: 1,
    keyName: "verisk-team",
    deployId: id,
    userData: base64Script,
  });
};

// This generates the script that the new EC2 will run after being spun up.
// The script will install needed dependencies (docker and AWS CLI), log in
// to the ecr registry, and then pull the docker image and run it in the background
// on port 8080.
const generateScript = (ECR_URI, name) => {
  let command = `#!/bin/bash
    sudo apt-get update
    sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    sudo apt update
    apt-cache policy docker-ce
    sudo apt install docker-ce -y
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    sudo apt install unzip
    sudo unzip awscliv2.zip
    sudo ./aws/install
    aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin ${ECR_URI}
    sudo docker run -d -p 8080:8080 ${ECR_URI}/${name}:latest`;
  return new Buffer(command).toString("base64");
};

module.exports = { deploy };
