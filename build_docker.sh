#!/bin/bash


# $ ./build_docker.sh 0.1.1

DOCKER_NAME=amrviz
current="1.0.0"


if [ $# -eq 0 ]; then
    echo "Use current $current"
    version="$current"
else
    version=$1
fi


# build docker image
docker build -f Dockerfile -t ${DOCKER_NAME} .

#tag
docker tag $DOCKER_NAME:latest amromics/$DOCKER_NAME:$version
#docker tag $DOCKER_NAME:latest amromics/$DOCKER_NAME:latest

#docker push amromics/amrviz:$version

