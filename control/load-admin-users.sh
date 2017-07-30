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
	# while IFS='||' read -ra USER; do
	IFS='|'
	for each LINE; do
		echo @@@@@@@@@
		echo ${USER[@]}
		echo @@@@@@@@@
		# for usr in "${USER[@]}"; do
			# echo $usr
			# echo ==========================
		# done
	done <<< "$ADMIN_USERS"
)

