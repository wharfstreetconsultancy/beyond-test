$env:REPOS_URI=(aws ecr describe-repositories --repository-names wharfstreetconsultancy/beyond-test --region us-west-2 --query repositories[0].repositoryUri) -replace '"'; "REPOS_URI: "+$env:REPOS_URI

# docker stop beyond_test
# docker rm beyond_test
"Deleting image..."
docker rmi $env:REPOS_URI":latest"
"Building image..."
docker build -t $env:REPOS_URI":latest" .
"Listing images..."
docker images
# docker run -p 80:8080 -d --name beyond_test wharfstreetconsultancy/beyond-test
# docker ps -a
Invoke-Expression -Command (aws ecr get-login --no-include-email --region us-west-2)
# docker tag wharfstreetconsultancy/beyond-test:latest $env:REPOS_URI":latest"
docker push $env:REPOS_URI":latest"
