#!/bin/bash

#
# Ensure 'super user' is executing this script
#
if [ "$USER" != "$SUPER_USER" ]; then
	echo Can only execute this script as super user: 'wsc-root'
	exit
fi

#
# Prompt 'super user' for AWS access key details (to run 'aws' cli) and other account defaults
#
echo "Enter AWS access key details (to run 'aws' cli) and other account defaults"
echo "(Hint: AWS access key can be downloaded once from AWS console)"
aws configure --profile $USER

#
# Fetch list of admin users: key=user-name; value=public-key
#
export ADMIN_USERS=$(aws dynamodb scan --profile $USER --table-name BeyondAdminUsers | jq -r '.Items[] | .UserName.S+"="+.PublicKey.S+"|"' | tr -d '\n')

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
				export USER_NAME; echo USER_NAME=$USER_NAME
				export PUBLIC_KEY; echo PUBLIC_KEY=$PUBLIC_KEY
				if id "$USER_NAME" >/dev/null 2>&1; then
					echo Updating public key for existing user: \'$USER_NAME\'
					sudo -H -u $USER_NAME bash -c "echo $PUBLIC_KEY > ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys"
				else
					echo Creating new user: \'$USER_NAME\'
					sudo adduser $USER_NAME
					sudo -H -u $USER_NAME bash -c "mkdir ~/.ssh; chmod 700 ~/.ssh; echo $PUBLIC_KEY > ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; ln -s /usr/local/src/beyond-test ~/beyond-test"
				fi
				echo
			done<<<"$USER"
		)
	done
)

