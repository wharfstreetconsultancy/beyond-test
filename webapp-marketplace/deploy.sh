#!/bin/bash

echo Stop which version?:
read oldVersion
echo Start which version?:
read newVersion

if [ "$1" == "sandbox" ]; then
	export desired_port='1'
fi

echo Test Port = $desired_port'443'

sudo docker stop webapp_marketplace-$oldVersion
sudo docker rm webapp_marketplace-$oldVersion
sudo docker build -t suroor-fashions/webapp-marketplace:$newVersion .
sudo docker run -p $desired_port'80:8080' -p $desired_port'443:8443' -d -e ENVIRONMENT=$1 -e SESSION_SECRET=$2 -e AWS_ACCESS_KEY_ID=$3 -e AWS_SECRET_ACCESS_KEY=$4 -e AWS_REGION=us-west-2 -e SECURE_PORT=$desired_port'443' -e REST_HOST=$5 -e REST_PORT=$desired_port'444' -e AUTH_CLIENT=$6 -e PGW_CLIENT=$7 -e PGW_SECRET=$8 --name webapp_marketplace-$newVersion suroor-fashions/webapp-marketplace:$newVersion
sudo docker logs webapp_marketplace-$newVersion --follow
