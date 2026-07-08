# Ansible Bootstrapping

Refer to [Manual Bootstrapping](#daemon-manual-bootstrap) if you would like to provision the probes by hand
> [!NOTE]
> Instructions on how to start, stop, and modify the scripted and daemonized versions of the service are in [Manual Bootstrapping](#daemon-manual-bootstrap), with additional details on flags and options in the [Daemon Options](#config-daemon-options) pages

## Setting up the daemon on the probes
1. Create a working directory that will hold the ansible repos and cd into that working directory
2. Clone the daemon repo
```
git clone https://github.com/UMNET-perfSONAR/ansible-playbook-pssid-daemon.git
```
3. Edit the `hosts` files located at `ansible-playbook-pssid-daemon/inventory/hosts` to contain the IPs of your probes
4. Install roles:
```shell
ansible-galaxy install -f -r requirements.yml --ignore-errors
```
5. cd into the root of the `ansible-playbook-pssid-daemon` directory and run the following command to ensure the host is reachable by ansible
```shell
ansible <host-pattern> -m ping
```
6. set up the daemon on each of the probes (NOTE: pscheduler will take a VERY long time to install, also sometimes cloning fails for no reason, just run it again)
```
ansible-playbook --ask-vault-pass --ask-pass --ask-become-pass --user usernamehere --become --become-user root --become-method su --inventory inventory/ playbook.yml
```
7. The configuration file is located on the pi at `/etc/pssid/pssid_config.json` needs to be sourced from the web server after being generated in the web interface. This file is located at `/var/lib/pssid/output/pssid_config.json`
8. The `wpa_supplicant` configuration file will likely have to be modified or created to customize. An example of an eduroam configuration is below:
```
ctrl_interface=/var/run/wpa_supplicant

network={
 ssid="eduroam"
 key_mgmt=WPA-EAP
 eap=PEAP
 proto=RSN
 pairwise=CCMP
 group=CCMP
 phase2="autheap=MSCHAPV2"
 identity="you_user"
 password="your_pass"
}
```