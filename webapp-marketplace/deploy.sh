#!/bin/bash

sudo docker stop webapp_marketplace-latest
sudo docker rm webapp_marketplace-latest
sudo docker build -t suroor-fashions/webapp-marketplace:latest .
sudo docker run -p 180:8080 -p 1443:8443 -d -e ENVIRONMENT=$1 -e SESSION_SECRET=$2 -e AWS_ACCESS_KEY_ID=$3 -e AWS_SECRET_ACCESS_KEY=$4 -e AWS_REGION=us-west-2 -e SECURE_PORT=1443 -e REST_HOST=$5 -e REST_PORT=1444 -e AUTH_CLIENT=$6 --name webapp_marketplace-latest suroor-fashions/webapp-marketplace:latest
sudo docker logs webapp_marketplace-latest --follow