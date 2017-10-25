#!/bin/bash

echo Stop which version?:
read oldVersion
echo Start which version?:
read newVersion

if [ "$1" == "sandbox" ]; then
	export desired_port='1'
fi

echo Test Port = $desired_port'443'

sudo docker stop webapp_productmanagement-$oldVersion
sudo docker rm webapp_productmanagement-$oldVersion
sudo docker build -t suroor-fashions/webapp-productmanagement:$newVersion .
sudo docker run -p $desired_port'81:8081' -p $desired_port'444:8444' -d -e ENVIRONMENT=$1 -e SESSION_SECRET=$2 -e AWS_ACCESS_KEY_ID=$3 -e AWS_SECRET_ACCESS_KEY=$4 -e AWS_REGION=us-west-2 -e SECURE_PORT=$desired_port'444' -e REST_HOST=$5 -e REST_PORT=$desired_port'444' -e ALLOWED_ORIGIN_PORT=$desired_port'444' --name webapp_productmanagement-$newVersion suroor-fashions/webapp-productmanagement:$newVersion
sudo docker logs webapp_productmanagement-$newVersion --follow