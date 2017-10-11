#!/bin/bash

sudo -H -u root bash -c 'docker stop webapp_productmanagement-latest; docker rm webapp_productmanagement-latest; docker build -t suroor-fashions/webapp-productmanagement:latest .'
sudo -H -u root bash -c 'docker run -p 181:8081 -p 1444:8444 -d -e ENVIRONMENT='echo $1' -e SESSION_SECRET='echo $2' -e AWS_ACCESS_KEY_ID='echo $3' -e AWS_SECRET_ACCESS_KEY='echo $4' -e AWS_REGION=us-west-2 -e PORT=1444 --name webapp_productmanagement-latest suroor-fashions/webapp-productmanagement:latest; docker logs webapp_productmanagement-latest --follow'
