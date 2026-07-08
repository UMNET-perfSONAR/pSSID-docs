# Installing the Daemon

## Prep Work
_Preparing the pi for [ansible](#daemon-ansible-bootstrap) or [manual](#daemon-manual-bootstrap) daemon installation, configuring ssh_

1. Download Ubuntu 22.04 or 24 LTS (server edition) for the Raspberry Pi 4. This can be acquired through the official [Raspberry Pi Imaging Software](https://www.raspberrypi.com/software/) 
2. Allow the pi to boot and log in with the default credentials `ubuntu ubuntu`
3. To access the pi over ssh, go to `/etc/ssh/sshd_config.d/` and make sure the files in this directory has password authentication enabled
```
PasswordAuth yes
```

4. Create a root password (by typing `passwd` as the root user) and reboot the pi, this time logging in as root (ensures there are no problems with the next steps)
5. Create a new user account, which will be used with ansible bootstrapping, and set a password
```
useradd -m usernamehere
passwd usernamehere
```

6. Disable the ubuntu user by modifying `/etc/passwd` and changing the shell to `/usr/bin/false `
7. Change the hostname to be the IP of the pi (helps with avoiding errors with the daemon later)
```
hostnamectl set-hostname <IP>
```

