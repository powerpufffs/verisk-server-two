const { aws } = require("./aws-config");

var ec2 = new aws.EC2();

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

        console.log(data);

        const reservations = data.Reservations;
        const instances = reservations.map((reservation) => {
          const { Instances } = reservation;
          const { PublicDnsName, Tags } = Instances;
          const { Value } = Tags.find((x) => x.Key === "deployId");
          return {
            dns: `${PublicDnsName}:8080/invocations`,
            id: Value,
          };
        });

        console.log(instances);
        return instances.flat();
      }
    )
    .promise();
};

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
