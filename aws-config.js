var aws = require("aws-sdk");

// aws.config.update({
//   accessKeyId: "YOUR_ACCESS_KEY",
//   secretAccessKey: "YOUR_SECRET_KEY",
//   region: "us-west-2",
// });
aws.config.update({region:'us-east-1'});

module.exports = {
    aws
}
