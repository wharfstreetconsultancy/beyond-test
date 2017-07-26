#!/bin/bash

#
# Functions
#

# getChangeStatus: Gets the status of the latest change
function getChangeStatus {
        export CHANGE_STATUS=$(aws route53 get-change --id $1 --query ChangeInfo.Status)
        export CHANGE_STATUS=$(echo $CHANGE_STATUS | tr -d "\"")
}

#
# Create hosted zone for the cluster
#

# Get current timestamp
export TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Create hosted zone
export DOMAIN=$TIMESTAMP.wharfstreetconsultancy.com
echo Creating domain: $DOMAIN
export CHANGE_ID=$(aws route53 create-hosted-zone --name $DOMAIN --caller-reference $TIMESTAMP --hosted-zone-config Comment="Hosted zone created by Beyond Admin user" --query ChangeInfo.Id)
export CHANGE_ID=$(echo $CHANGE_ID | tr -d "\"")
echo $CHANGE_ID

# Wait for hosted zone to propagate across all DNS servers
until [ "$CHANGE_STATUS" == "INSYNC" ]; do
        getChangeStatus $CHANGE_ID
        echo Status is still $CHANGE_STATUS
        sleep 5
done

# TODO - Update sub-domain hosted zone with root-domain NS records...

#
# Create cluster records in S3
#
export BUCKET=cluster.$DOMAIN
echo Creating bucket: $BUCKET
aws s3 mb s3://$BUCKET
export KOPS_STATE_STORE=s3://$BUCKET

#
# Create Kubernetes cluster
#

# TODO - Secure access to these AMI credentials
#####
export AWS_ACCESS_KEY_ID=AKIAJTCXWZITSWVQIBCA
export AWS_SECRET_ACCESS_KEY=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
#####

# Configure cluster
kops create cluster --ssh-public-key ~/.ssh/authorized_keys --zones=us-west-2a $DOMAIN

# Build cluster
kops update cluster --ssh-public-key ~/.ssh/authorized_keys --zones=us-west-2a $DOMAIN

