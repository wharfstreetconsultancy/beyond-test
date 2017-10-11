#!/bin/bash

export ENVIRONMENT=$1
export SESSION_SECRET=$2
export AWS_ACCESS_KEY_ID=$3
export AWS_SECRET_ACCESS_KEY=$4

sudo -H -u root bash -c 'docker stop webapp_productmanagement-latest; docker rm webapp_productmanagement-latest; docker build -t suroor-fashions/webapp-productmanagement:latest .'
sudo -H -u root bash -c 'docker run -p 181:8081 -p 1444:8444 -d -e ENVIRONMENT=$ENVIRONMENT -e SESSION_SECRET=$SESSION_SECRET -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -e AWS_REGION=us-west-2 -e PORT=1444 --name webapp_productmanagement-latest suroor-fashions/webapp-productmanagement:latest; docker logs webapp_productmanagement-latest --follow'
