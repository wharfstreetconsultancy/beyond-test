#!/bin/bash

#
# Ensure 'wsc-root' account profile is configured
#
echo Configure 'wsc-root' access key details...
aws configure --profile wsc-root

#
# Fetch list of admin users
#
export ADMIN_USERS=$(aws dynamodb scan --table-name BeyondAdminUsers | jq -r '.Items[] | .UserName.S+"="+.PublicKey.S')

echo $ADMIN_USERS

# if [ -f "$file" ]
# then
#  echo "$file found."

  while IFS='=' read -r key value
  do
    key=$(echo $key | tr '.' '_')
    eval "${key}='${value}'"
  done < $(echo $ADMIN_USERS)

#  echo "User Id       = " ${db_uat_user}
#  echo "user password = " ${db_uat_passwd}
# else
#   echo "$file not found."
# fi