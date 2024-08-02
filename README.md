# pSSID Documentation v0.1

### Intro
The entire pSSID system consists of three major components, a frontend GUI controller,
a scalable collection of Raspberry Pi WiFi probes, and a data analytics pipeline.

<p align="center">
<img src="images/pSSID-architecture.png" width="50%"></img>
</p>

The high level workflow is as follows. Users interact with the frontend controller
to define available probes and tasks to run. Then the list of tasks will be copied
onto the defined probes as config files and initiate pSSID daemon. After the
daemon finishes a task, output metrics will be forwarded to the data server for
storage and visualization.


### pSSID GUI Dashboard
Source project: https://github.com/UMNET-perfSONAR/pssid-gui2

Deployment scripts:
https://github.com/UMNET-perfSONAR/ansible-playbook-pssid-GUI-deploy

(For developers) build and publish scripts:
https://github.com/UMNET-perfSONAR/ansible-playbook-pssid-GUI-build-publish

### pSSID Daemon
- Prereqs
- Installation
- Usage
- Large-scale deployment & provisioning with Ansible

### pSSID Daemon
```
curl -o /etc/apt/sources.list.d/perfsonar-5.0-snapshot.list  http://downloads.perfsonar.net/debian/perfsonar-5.0-snapshot.list
curl http://downloads.perfsonar.net/debian/perfsonar-snapshot.gpg.key | apt-key add -
apt-get update
apt-get install -y perfsonar-toolkit
```

[RPi bootstrap instructions](RPi_bootstrap.MD)


 - https://github.com/umnET-perfSONAR/ansible-playbook-pssid-daemon

 - https://github.com/umNET-perfSONAR/ansible-playbook-pssid-gui

 - https://github.com/umnET-perfSONAR/ansible-playbook-pssid-database

 - 

### pSSID Data Analytics
https://github.com/UMNET-perfSONAR/pssid-data-pipeline
