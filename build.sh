# !/bin/bash

# Set default names for image and container
imageName=ta/ta007
containerName=TeamAssist

# Build image with the same image name
echo Building new image...
docker build -t $imageName -f Dockerfile  .

# Remove existing container running old image
echo Deleting old container...
docker rm -f $containerName

# Delete old images that:
# 1. No longer have a reference
# 2. Do not currently have a container using it
echo Deleting old image...
docker image prune -f

# Run new container
echo Running new container...
docker run -d -p 80:80 --name $containerName $imageName

# docker tag ta/ta007:latest YOUR_ECR_ID.dkr.ecr.us-east-1.amazonaws.com/ta/ta007:latest
# docker push YOUR_ECR_ID.dkr.ecr.us-east-1.amazonaws.com/ta/ta007:latest
# aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_ID.dkr.ecr.us-east-1.amazonaws.com
# docker login -u AWS -p $(aws ecr get-login-password --region us-east-1) YOUR_ECR_ID.dkr.ecr.the-region-you-are-in.amazonaws.com