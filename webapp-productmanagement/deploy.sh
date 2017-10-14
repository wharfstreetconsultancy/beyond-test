#!/bin/bash

echo Stop which version?:
read oldVersion
echo Start which version?:
read newVersion

echo oldVersion=$oldVersion
echo newVersion=$newVersion

# sudo docker stop webapp_productmanagement-$oldVersion
# sudo docker rm webapp_productmanagement-$oldVersion
# sudo docker build -t suroor-fashions/webapp-productmanagement:$newVersio .
# sudo docker run -p 181:8081 -p 1444:8444 -d -e ENVIRONMENT=$1 -e SESSION_SECRET=$2 -e AWS_ACCESS_KEY_ID=$3 -e AWS_SECRET_ACCESS_KEY=$4 -e AWS_REGION=us-west-2 -e SECURE_PORT=1444 -e REST_HOST=$5 -e REST_PORT=1444 -e ALLOWED_ORIGIN_PORT=1444 --name webapp_productmanagement-$newVersio suroor-fashions/webapp-productmanagement:$newVersio
# sudo docker logs webapp_productmanagement-$newVersio --follow