#!/bin/bash

SRV_ENV=$(aws s3 cp s3://suroor.fashions.config/marketplace_server.sandbox.env.properties -)
PGW_ENV=$(aws s3 cp s3://suroor.fashions.config/payment_gateway.sandbox.env.properties -)

SESSION_SECRET=$(jq -r '.sessionSecret' <<< "${SRV_ENV}")
AWS_REGION=$(jq -r '.region' <<< "${SRV_ENV}")
USER_POOL_CLIENT=$(jq -r '.userPoolClient' <<< "${SRV_ENV}")
NON_SECURE_PORT=$(jq -r '.nonSecurePort' <<< "${SRV_ENV}")
SECURE_PORT=$(jq -r '.securePort' <<< "${SRV_ENV}")
AGW_HOST=$(jq -r '.apiGatewayHost' <<< "${SRV_ENV}")
AGW_PORT=$(jq -r '.apiGatewayPort' <<< "${SRV_ENV}")

PGW_CLIENT=$(jq -r '.client' <<< "${PGW_ENV}")
PGW_SECRET=$(jq -r '.secret' <<< "${PGW_ENV}")
PGW_HOST=$(jq -r '.host' <<< "${PGW_ENV}")

kubectl run marketplace --image=471388289254.dkr.ecr.us-west-2.amazonaws.com/wharfstreetconsultancy/beyond-test:latest --port=8443 --env="DOMAIN=cluster,SRV_ENV=staging,PGW_ENV=staging,SESSION_SECRET=$SESSION_SECRET,AWS_REGION=$AWS_REGION,SECURE_PORT=$SECURE_PORT,REST_HOST=$AGW_HOST,REST_PORT=$AGW_PORT,AUTH_CLIENT=$USER_POOL_CLIENT,PGW_HOST=$PGW_HOST,PGW_CLIENT=$PGW_CLIENT,PGW_SECRET=$PGW_SECRET"
# kubectl expose deployment marketplace --port=443 --name=marketplace-https

