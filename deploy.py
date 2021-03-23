# aws ec2 run-instances 
#   --image-id ami-042e8287309f5df03 
#   --instance-type t2.micro --count 1 
#   --tag-specifications 'ResourceType=instance,Tags=[{Key=deployID,Value=1234}]' 
#   --subnet-id subnet-02fae22e3e7147ba0 --security-group-ids sg-056ff00b48bd090df 
#   --key-name verisk-team 
#   --iam-instance-profile Name=verisk-ec2


# aws ec2 run-instances 
# --image-id ami-042e8287309f5df03 
# --instance-type t2.micro 
# --count 1 
# --tag-specifications 'ResourceType=instance,Tags=[{Key=deployID,Value=1234}]' 
# --subnet-id subnet-02fae22e3e7147ba0 
# --security-group-ids sg-056ff00b48bd090df 
# --key-name verisk-team 
# --iam-instance-profile Name=verisk-ec2

import boto3

client = boto3.client('ec2', region_name='us-west-2')

value = 1234

response = client.run_instances(
    ImageId="ami-042e8287309f5df03",
    InstanceType="t2.micro",
    MaxCount=1,
    MinCount=1,
    TagSpecifications=[
        {
            'ResourceType': 'instance',
            'Tags': [
                {
                    'Key': 'deployId',
                    'Value': value,
                },
            ]
        },
    ],
    SubnetId="subnet-02fae22e3e7147ba0",
    SecurityGroupIds="sg-056ff00b48bd090df",
    KeyName="verisk-team",
    IamInstanceProfile={
        'Name': 'verisk-ec2'
    }
)

response = client.describe_instances(
    Filters=[
        {
            'Name': 'tag:deployID',
            'Values': [
                '1234',
            ]
        },
    ],
)

# "Reservations[*].Instances[*].{Instance:PublicDnsName}"

reservations = response['Reservations']

for reservation in reservations:
    instances = reservation['Instances']
    for instance in instances:
        print(instance['PublicDnsName'])



