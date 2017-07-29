#!/bin/bash

#
# Ensure 'wsc-root' account profile is configured
#
echo Configure 'wsc-root' access key details...
aws configure --profile wsc-root

#
# Fetch list of admin users
#
export ADMIN_USERS=$(aws dynamodb scan --table-name BeyondAdminUsers | jq -r '.Items[] | .UserName.S+"="+.PublicKey.S+"\n"')

echo $ADMIN_USERS

# if [ -f "$file" ]
# then
#  echo "$file found."

(
IFS='\n'
for p in $ADMIN_USERS; do
	# key=$(echo $key | tr '.' '_')
	# eval "${key}='${value}'"
	echo "$p"
done
)

#  echo "User Id       = " ${db_uat_user}
#  echo "user password = " ${db_uat_passwd}
# else
#   echo "$file not found."
# fi