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