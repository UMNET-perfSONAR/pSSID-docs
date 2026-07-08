# About

__pSSID__ is a bottom up WiFi monitoring solution based on perfSONAR which is designed to detect outages from the perspective of a user. The system consists of three major components, a frontend GUI controller, a scalable collection of minicomputer WiFi probes, and a data analytics pipeline.
___

## High Level Workflow
1. Users interact with the frontend controller to define available probes and tasks to run.
2. The list of tasks is copied onto the defined probes as config files and initiate pSSID daemon, either on bare metal or containerized. 
3. After the daemon finishes a task, output metrics will be forwarded to the data server for
storage and visualization.

## Target Audience
1. Institutions and organizations that benefit from network monitoring software such as perfSONAR, and would like to employ Wifi monitoring in a cost effective way
