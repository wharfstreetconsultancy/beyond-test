#!/bin/bash

# sudo -H -u root bash -c 'docker stop webapp_productmanagement-latest; docker rm webapp_productmanagement-latest; docker build -t suroor-fashions/webapp-productmanagement:latest .'
# sudo -H -u root bash -c 'docker run -p 181:8081 -p 1444:8444 -d -e ENVIRONMENT="$1" -e SESSION_SECRET=${2} -e AWS_ACCESS_KEY_ID=${3} -e AWS_SECRET_ACCESS_KEY=${4} -e AWS_REGION=us-west-2 -e PORT=1444 --name webapp_productmanagement-latest suroor-fashions/webapp-productmanagement:latest; docker logs webapp_productmanagement-latest --follow'
sudo docker stop webapp_productmanagement-latest
sudo docker rm webapp_productmanagement-latest
sudo docker build -t suroor-fashions/webapp-productmanagement:latest .
sudo docker run -p 181:8081 -p 1444:8444 -d -e ENVIRONMENT=$1 -e SESSION_SECRET=$2 -e AWS_ACCESS_KEY_ID=$3 -e AWS_SECRET_ACCESS_KEY=$4 -e AWS_REGION=us-west-2 -e SECURE_PORT=1444 -e REST_HOST=$5 -e REST_PORT=1444 -e ALLOWED_ORIGIN_PORT=1444 --name webapp_productmanagement-latest suroor-fashions/webapp-productmanagement:latest
sudo docker logs webapp_productmanagement-latest --follow