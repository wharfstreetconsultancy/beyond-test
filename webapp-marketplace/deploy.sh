#!/bin/bash

echo Stop which version?:
read oldVersion
echo Start which version?:
read newVersion

AWS_PROFILE=$3
echo AWS_PROFILE=$AWS_PROFILE

SRV_ENV=$(aws s3 cp s3://suroor.fashions.config/marketplace_server.$1.env.properties - --profile $AWS_PROFILE)
PGW_ENV=$(aws s3 cp s3://suroor.fashions.config/payment_gateway.$2.env.properties - --profile $AWS_PROFILE)

SESSION_SECRET=$(jq -r '.sessionSecret' <<< "${SRV_ENV}")
AWS_ACCESS_KEY_ID=$4
AWS_SECRET_ACCESS_KEY=$5
AWS_REGION=$(jq -r '.region' <<< "${SRV_ENV}")
USER_POOL_CLIENT=$(jq -r '.userPoolClient' <<< "${SRV_ENV}")
NON_SECURE_PORT=$(jq -r '.nonSecurePort' <<< "${SRV_ENV}")
SECURE_PORT=$(jq -r '.securePort' <<< "${SRV_ENV}")
AGW_HOST=$(jq -r '.apiGatewayHost' <<< "${SRV_ENV}")
AGW_PORT=$(jq -r '.apiGatewayPort' <<< "${SRV_ENV}")

PGW_CLIENT=$(jq -r '.client' <<< "${PGW_ENV}")
PGW_SECRET=$(jq -r '.secret' <<< "${PGW_ENV}")
PGW_HOST=$(jq -r '.host' <<< "${PGW_ENV}")

echo SESSION_SECRET=$SESSION_SECRET
echo AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
echo AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
echo AWS_REGION=$AWS_REGION
echo USER_POOL_CLIENT=$USER_POOL_CLIENT
echo NON_SECURE_PORT=$NON_SECURE_PORT
echo SECURE_PORT=$SECURE_PORT
echo AGW_HOST=$AGW_HOST
echo AGW_PORT=$AGW_PORT

echo PGW_CLIENT=$PGW_CLIENT
echo PGW_SECRET=$PGW_SECRET
echo PGW_HOST=$PGW_HOST

sudo docker stop webapp_marketplace-$oldVersion
sudo docker rm webapp_marketplace-$oldVersion
sudo docker build -t suroor-fashions/webapp-marketplace:$newVersion .
sudo docker run -p $NON_SECURE_PORT:8080 -p $SECURE_PORT:8443 -d -e SRV_ENV=$1 -e PGW_ENV=$2 -e SESSION_SECRET=$SESSION_SECRET -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -e AWS_REGION=$AWS_REGION -e SECURE_PORT=$SECURE_PORT -e REST_HOST=$AGW_HOST -e REST_PORT=$AGW_PORT -e AUTH_CLIENT=$USER_POOL_CLIENT -e PGW_HOST=$PGW_HOST -e PGW_CLIENT=$PGW_CLIENT -e PGW_SECRET=$PGW_SECRET --name webapp_marketplace-$newVersion suroor-fashions/webapp-marketplace:$newVersion
#sudo docker run -p $NON_SECURE_PORT:8080 -p $SECURE_PORT:8443 -d -e SRV_ENV=$1 -e PGW_ENV=$2 -e SESSION_SECRET=$SESSION_SECRET -e AWS_PROFILE=$3 -e AWS_REGION=$AWS_REGION -e SECURE_PORT=$SECURE_PORT -e REST_HOST=$AGW_HOST -e REST_PORT=$AGW_PORT -e AUTH_CLIENT=$USER_POOL_CLIENT -e PGW_HOST=$PGW_HOST -e PGW_CLIENT=$PGW_CLIENT -e PGW_SECRET=$PGW_SECRET --name webapp_marketplace-$newVersion suroor-fashions/webapp-marketplace:$newVersion
sudo docker logs webapp_marketplace-$newVersion --follow
