# Manual Bootstrapping

Refer to [Ansible Bootstrapping](#daemon-ansible-bootstrap) to automate this process
1. Install pscheduler
```shell
curl -s https://raw.githubusercontent.com/perfsonar/project/master/install-perfsonar \
  | sh -s - --auto-updates --tunings testpoint
```
## Syslog Configuration
By default, pssid-daemon.py uses Local0 and write to pssid.log under /var/log.
1. Add `local0.* /var/log/pssid.log` to the end of `/etc/rsyslog.conf`
```shell
echo 'local0.* /var/log/pssid.log' >> /etc/rsyslog.conf
```

2. Restart syslog service
```shell
systemctl restart rsyslog
```

## Network Configuration Tools
1. Clone VT-collab tools. Copy the files inside VT-collab folder to `usr/lib/exec/pssid/`
```shell
git clone https://github.com/UMNET-perfSONAR/VT-collab.git
```

2. Follow the base setup instruction in the repo, or as follows
```shell
apt install jq dhcpcd5
systemctl --now disable dhcpcd.service unattended-upgrades wpa_supplicant
```

3. Ensure both `pssid-80211` and `pssid-dhcp` are executable
```shell
chmod +x pssid-80211
chmod +x pssid-dhcp
```

3. For testing these scripts specifically, refer to the VT-Tools repo
4. Move the wpa_supplicant configuration file to `etc/wpa_supplicant/`. Name the file `wpa_supplicant_{ssid}.conf`, and ensure the ssid is consistent with your Wi-Fi testing environment.

## Install Additional Dependencies
```shell
apt install python3-pip
apt install iw
pip install croniter
```

## Usage
1. Clone this repo and move the daemon and batch processor into `/usr/bin/pssid/`. Move the default configuration file into `/etc/pssid/`. A custom configuration file can be generated in the web interface. This customized file is located at `/var/lib/pssid/output/pssid_config.json` on the web server after generation.
```shell
git clone https://github.com/UMNET-perfSONAR/pssid-daemon.git
```

```shell
mkdir /usr/bin/pssid
mv pssid-daemon.py batch_processor_format_template.j2 /usr/bin/pssid/
mkdir /etc/pssid
mv pssid_config.json /etc/pssid
```

2. The daemon must be run as root, with no arguments, the daemon will assume the hostname of the machine is its IP and the location of the config. These can be specified as follows

> [!NOTE]
> More options for running the daemon with flags can be found in the [Daemon Options](#config-daemon-options) pages

```shell
python3 pssid-daemon.py --hostname "198.111.226.184" --config /etc/pssid/pssid_config.json
```

3. Specifying syslog facility
```shell
python3 pssid-daemon.py --facility local1
```

4. Validating the `pssid_config.json` file before running batches
```shell
python3 pssid-daemon.py  --validate
```

5. Enable batch processor debug message
```shell
python3 pssid-daemon.py  --debug
```

6. Checking syslog with live updates
```shell
tail -f /var/log/pssid.log
```

## Manual Daemonization
> Probes running pssid-daemon program may be interrupted by provisioning. Daemonizing the program is thus necessary. 
1. First, create a systemd service file, called pssid-daemon.service.
```shell
cd /etc/systemd/system
vim pssid-daemon.service
```

2. Add the following contents to the file. Make sure hostname is the GUI configuration file, otherwise, please specify using --hostname argument.
```shell
[Unit]
Description=”Pssid-Daemon”

[Service]
Restart=always
WorkingDirectory=/usr/bin/pssid/
ExecStart=/usr/bin/python3 pssid-daemon.py

[Install]
WantedBy=multi-user.target
```

3. Restart daemon service, check status, and enable the service.
```shell
systemctl daemon-reload
systemctl restart pssid-daemon.service
systemctl status pssid-daemon.service
systemctl enable pssid-daemon.service
```
