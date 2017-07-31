#!/bin/bash

#
# Ensure 'wsc-root' account profile is configured
#
echo Configure 'wsc-root' access key details...
aws configure --profile wsc-root

#
# Fetch list of admin users: key=user-name; value=public-key
#
export ADMIN_USERS=$(aws dynamodb scan --table-name BeyondAdminUsers | jq -r '.Items[] | .UserName.S+"="+.PublicKey.S+"|"' | tr -d '\n')

echo RAW DATA:
echo ==========================
echo $ADMIN_USERS
echo ==========================
echo

(
	IFS='|'
	for USER in $ADMIN_USERS; do
		(
			while IFS='=' read -r USER_NAME PUBLIC_KEY; do
				echo USER_NAME=$USER_NAME
				echo PUBLIC_KEY=$PUBLIC_KEY
				if id "$USER_NAME" >/dev/null 2>&1; then
					echo User \'$USER_NAME\' exists
				else
					echo Creating new user: \'$USER_NAME\'
					sudo adduser $USER_NAME
					sudo -H -u $USER_NAME bash -c 'mkdir ~/.ssh; chmod 700 ~/.ssh; echo $PUBLIC_KEY > ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; ln -s /usr/local/src/beyond-test ~/beyond-test'
				fi
				echo
			done<<<"$USER"
		)
	done
)

