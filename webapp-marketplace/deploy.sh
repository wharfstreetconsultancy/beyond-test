#!/bin/bash

echo Stop which version?:
read oldVersion
echo Start which version?:
read newVersion

SRV_ENV=$(aws s3 cp s3://suroor.fashions.config/marketplace_server.$1.env.properties - --profile suroor-fashions_webapp-productmanagement)
PGW_ENV=$(aws s3 cp s3://suroor.fashions.config/payment_gateway.$2.env.properties - --profile suroor-fashions_webapp-productmanagement)

SESSION_SECRET=$(jq -r '.sessionSecret' <<< "${SRV_ENV}")
REGION=$(jq -r '.region' <<< "${SRV_ENV}")
USER_POOL_CLIENT=$(jq -r '.userPoolClient' <<< "${SRV_ENV}")
NON_SECURE_PORT=$(jq -r '.nonSecurePort' <<< "${SRV_ENV}")
SECURE_PORT=$(jq -r '.securePort' <<< "${SRV_ENV}")
AGW_HOST=$(jq -r '.apiGatewayHost' <<< "${SRV_ENV}")
AGW_PORT=$(jq -r '.apiGatewayPort' <<< "${SRV_ENV}")

PGW_CLIENT=$(jq -r '.client' <<< "${SRV_ENV}")
PGW_SECRET=$(jq -r '.secret' <<< "${SRV_ENV}")

echo SESSION_SECRET=$SESSION_SECRET
echo REGION=$REGION
echo USER_POOL_CLIENT=$USER_POOL_CLIENT
echo NON_SECURE_PORT=$NON_SECURE_PORT
echo SECURE_PORT=$SECURE_PORT
echo AGW_HOST=$AGW_HOST
echo AGW_PORT=$AGW_PORT

echo PGW_CLIENT=$PGW_CLIENT
echo PGW_SECRET=$PGW_SECRET

#sudo docker stop webapp_marketplace-$oldVersion
#sudo docker rm webapp_marketplace-$oldVersion
#sudo docker build -t suroor-fashions/webapp-marketplace:$newVersion .
#sudo docker run -p $desired_port'80:8080' -p $desired_port'443:8443' -d -e ENVIRONMENT=$1 -e SESSION_SECRET=$2 -e AWS_ACCESS_KEY_ID=$3 -e AWS_SECRET_ACCESS_KEY=$4 -e AWS_REGION=us-west-2 -e SECURE_PORT=$desired_port'443' -e REST_HOST=$5 -e REST_PORT=$desired_port'444' -e AUTH_CLIENT=$6 -e PGW_CLIENT=$7 -e PGW_SECRET=$8 --name webapp_marketplace-$newVersion suroor-fashions/webapp-marketplace:$newVersion
#sudo docker logs webapp_marketplace-$newVersion --follow
