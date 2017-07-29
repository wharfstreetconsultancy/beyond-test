#!/bin/bash

#
# Install docker
#
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user


#
# Install kubernetes
#

# 'kubectl' module
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.7.2/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl

# 'kops' module
wget https://github.com/kubernetes/kops/releases/download/1.6.1/kops-linux-amd64
chmod +x kops-linux-amd64
sudo mv kops-linux-amd64 /usr/local/bin/kops

#
# Install git
#
sudo yum install -y git

#
# Install jq
#
sudo yum install -y jq

#
# Clone admin scripts and dockerfile
#
git clone https://github.com/wharfstreetconsultancy/beyond-test.git /usr/local/src/beyond-test
chmod -R +x /usr/local/src/beyond-test


