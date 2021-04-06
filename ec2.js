const { aws } = require("./aws-config");

var ec2 = new aws.EC2();

// Used to get the data of the EC2 instances that are currently hosting a
// deployed MLModel.
const describeInstances = async ({ filterId }) => {
  return ec2
    .describeInstances(
      {
        // Filters: [{ Name: "tag:deployID", Values: [deployId] }],
        Filters: [{ Name: "tag:ec2GroupId", Values: [filterId] }],
      },
      function(err, data) {
        if (err) {
          console.error(err.toString());
        }
      }
    )
    .promise();
};


// Used to create an EC2 instance which will host a deployed MLModel
const createInstance = async ({
  imageId,
  count,
  keyName,
  subnetId = "subnet-02fae22e3e7147ba0",
  securityGroupIds = ["sg-056ff00b48bd090df"],
  deployId,
  userData,
}) => {
  return await ec2
    .runInstances(
      {
        ImageId: imageId,
        MinCount: count,
        MaxCount: count,
        KeyName: keyName,
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [
              {
                Key: "deployId",
                Value: deployId,
              },
              {
                Key: "ec2GroupId",
                Value: "EC2_LIVE",
              },
            ],
          },
        ],
        SubnetId: subnetId,
        SecurityGroupIds: securityGroupIds,
        InstanceType: "t2.micro",
        IamInstanceProfile: {
          Name: "verisk-ec2",
        },
        UserData: userData,
      },
      function(err, data) {
        if (err) {
          console.error(err.toString());
        } else {
          for (var i in data.Instances) {
            var instance = data.Instances[i];
            console.log("NEW:\t" + instance.InstanceId);
          }
        }
      }
    )
    .promise();
};

const terminateInstance = async (instanceId) => {
  return await ec2
    .terminateInstances({ InstanceIds: [instanceId] }, function(err, data) {
      if (err) {
        console.error(err.toString());
      } else {
        for (var i in data.TerminatingInstances) {
          var instance = data.TerminatingInstances[i];
          console.log("TERM:\t" + instance.InstanceId);
        }
      }
    })
    .promise();
};

module.exports = {
  describeInstances,
  createInstance,
  terminateInstance,
};
