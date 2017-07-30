#!/bin/bash

#
# Ensure 'wsc-root' account profile is configured
#
echo Configure 'wsc-root' access key details...
aws configure --profile wsc-root

#
# Fetch list of admin users
#
export ADMIN_USERS=$(aws dynamodb scan --table-name BeyondAdminUsers | jq -r '.Items[] | "user="+.UserName.S+"|key="+.PublicKey.S+"||"')

echo $ADMIN_USERS
echo
echo ==========================
echo

(
	IFS='||'
	for word in $ADMIN_USERS; do
		echo @@@@@@@@@
		echo Length: ${#$word}
		echo $word
		echo @@@@@@@@@
	done
)

