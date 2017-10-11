#!/bin/bash

echo ENVIRONMENT=$1
echo SESSION_SECRET=$2
echo AWS_ACCESS_KEY_ID=$3
echo AWS_SECRET_ACCESS_KEY=$4

sudo -H -u root bash -c 'docker stop webapp_productmanagement-latest; docker rm webapp_productmanagement-latest; docker build -t suroor-fashions/webapp-productmanagement:latest .'
sudo -H -u root bash -c 'docker run -p 181:8081 -p 1444:8444 -d -e ENVIRONMENT=$1 -e SESSION_SECRET=$2 -e AWS_ACCESS_KEY_ID=$3 -e AWS_SECRET_ACCESS_KEY=$4 -e AWS_REGION=us-west-2 -e PORT=1444 --name webapp_productmanagement-latest suroor-fashions/webapp-productmanagement:latest; docker logs webapp_productmanagement-latest --follow'
