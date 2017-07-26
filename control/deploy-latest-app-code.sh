#!/bin/bash

#
# Get existing docker container repository
#
export REPOS_URI=(aws ecr describe-repositories --repository-names wharfstreetconsultancy/beyond-test --region us-west-2 --query repositories[0].repositoryUri)
export REPOS_URI=$(echo $REPOS_URI | tr -d "\"")
echo $REPOS_URI

# Deleting image
docker rmi $REPOS_URI:latest

# Building image
docker build -t $REPOS_URI:latest ../app

# List images
docker images

# Push image to container registry
docker push $env:REPOS_URI":latest"
