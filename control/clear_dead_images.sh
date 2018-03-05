#!/bin/bash


docker images | grep "<none>" | awk \'{print "sudo docker rmi "$3}\' | bash