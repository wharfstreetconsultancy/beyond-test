#!/bin/bash

#
# Functions
#

# getChangeStatus: Gets the status of the latest change
function getChangeStatus {
        export CHANGE_STATUS=$(aws route53 get-change --profile $USER --id $1 | jq -r '.ChangeInfo.Status')
        echo Status of $1: $CHANGE_STATUS
}

#
# Prompt user for AWS access key details (to run 'aws' cli) and other account defaults
#
echo "Enter AWS access key details (to run 'aws' cli) and other account defaults"
echo "(Hint: AWS access key can be downloaded once from AWS console)"
aws configure --profile $USER

#
# Create hosted zone for the cluster
#

# Get current timestamp
export TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Define the root-domain for this deployment
export ROOT_DOMAIN=wharfstreetconsultancy.com
echo "Root-domain (pre-existing): $ROOT_DOMAIN"

# Define the sub-domain for this deployment
export SUB_DOMAIN=$TIMESTAMP.beyond.$ROOT_DOMAIN
echo "Sub-domain (to be created): $SUB_DOMAIN"

# List all reusable record sets associated with this profile
export RECORD_SETS=$(aws route53 list-reusable-delegation-sets --profile $USER)
export RECORD_SET_COUNT=$(echo $RECORD_SETS | jq -r '.DelegationSets | length') 

# Check that there is only one reusable record set
if [ $RECORD_SET_COUNT -eq 0 ]; then
	echo No reusable delegation set found. Please create one.
	exit
elif [ $RECORD_SET_COUNT -gt 1 ]; then
	echo More than one reusable delegation set found. Please delete one.
	exit
fi

# Get resource record set for use when creating sub-domain
export RECORD_SET_ID=$(echo $RECORD_SETS | jq -r '.DelegationSets[0].Id | split("/") | .[2]')
echo "Reusable record set ID: $RECORD_SET_ID"

# Create hosted zone for sub-domain
export CHANGE_ID=$(aws route53 create-hosted-zone --profile $USER --name $SUB_DOMAIN --caller-reference $TIMESTAMP --hosted-zone-config Comment="Hosted zone created by Beyond Admin user" --delegation-set-id $RECORD_SET_ID | jq -r '.ChangeInfo.Id | split("/") | .[2]')
echo Sub-domain created. Track status using change ID: $CHANGE_ID

# Wait for hosted zone to propagate across all DNS servers
until [ "$CHANGE_STATUS" == "INSYNC" ]; do
        getChangeStatus $CHANGE_ID
        sleep 5
done

#
# Create cluster records in S3
#
export BUCKET=cluster.$SUB_DOMAIN
echo Creating bucket: $BUCKET
aws s3 mb s3://$BUCKET --profile $USER
export KOPS_STATE_STORE=s3://$BUCKET

#
# Create Kubernetes cluster
#

# Configure cluster
# kops create cluster --ssh-public-key ~/.ssh/authorized_keys --zones=us-west-2a $SUB_DOMAIN

# Build cluster
# kops update cluster --ssh-public-key ~/.ssh/authorized_keys --zones=us-west-2a $SUB_DOMAIN

