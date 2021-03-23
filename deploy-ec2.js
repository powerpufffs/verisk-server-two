const {
  describeInstances,
  createInstance,
  terminateInstance,
} = require("./ec2");

const idGenerator = () => {
  let id = 1000;
  return () => {
    id++;
    return id;
  };
};

const deploy = async ({ ecrUri, tag }) => {
  const generator = idGenerator();
  const base64Script = generateScript(ecrUri, tag);
  const id = generator().toString()

  let response;
  try {
    response = await createInstance({
      imageId: "ami-042e8287309f5df03",
      count: 1,
      keyName: "verisk-team",
      deployId: id,
      userData: base64Script,
    });
  } catch (e) {
    console.log(e);
  }

  console.log(response);

  let instances
  try {
    instances = await describeInstances({ deployId: id });
  } catch (e) {
    console.log(e);
  }

  const { PublicDnsName } = instances[0];
  return PublicDnsName;
};

const generateScript = (ECR_URI, tag) => {
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
    sudo docker run -d -p 8080:8080 ${ECR_URI}/${tag}`;

  return new Buffer(command).toString("base64");
};

module.exports = { deploy };
