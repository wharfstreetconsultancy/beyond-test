$env:AWS_DEFAULT_PROFILE="default"; "AWS_DEFAULT_PROFILE: "+$env:AWS_DEFAULT_PROFILE
$env:KUBERNETES_PROVIDER="aws"
Invoke-WebRequest -OutFile - -PassThru https://get.k8s.io | cmd
