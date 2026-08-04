# PXE Booting Deployment

> [!Note] This documentation is a work in progress

## Booting Setup
- rpi-eeprom should already be installed (ubuntu for the raspberry pi)
- Set the boot order to network first, and SD card fallback
```sh
sudo rpi-eeprom-config --edit
```
- by default has:
```
BOOT_UART=0
WAKE_ON_GPIO=1
POWER_OFF_ON_HALT=0
```
- add:
```
BOOT_ORDER=0x21
```
- `vcgencmd bootloader_config` should show the expected config
- Can check to see if the config is changed with the following:
```
ls -l /boot/firmware/*.upd
ls -l /boot/firmware/pieeprom*
-rwxr-xr-x 1 root root 524288 Jun 15 18:36 /boot/firmware/pieeprom.upd
-rwxr-xr-x 1 root root     80 Jun 15 18:36 /boot/firmware/pieeprom.sig
-rwxr-xr-x 1 root root 524288 Jun 15 18:36 /boot/firmware/pieeprom.upd

rpi-eeprom-config /boot/firmware/pieeprom.upd
BOOT_UART=0
WAKE_ON_GPIO=1
POWER_OFF_ON_HALT=0
BOOT_ORDER=0x2
```
- Rebooting the pi WITHOUT running rpi-eeprom-update -a to ensure the change is persistent (rebooting with the update command will reset it to default)
- After eeprom flash the pi technically doesn't need the sd card at all if network boot works, but keep the card for troubleshooting purposes
## Server Utils
- Installing dhcp, tftp, web server
```sh
sudo apt install dnsmasq tftpd-hpa nginx
```
- Edit `/etc/dnsmasq.conf`, making sure to make appropriate modifications based on dhcp management
```ini
# no dns
port=0

log-dhcp
log-debug

# pi facing interface
interface=eth0

# CHANGE THIS based on your dhcp, proxy use is for externally managed dhcp
dhcp-range=198.111.226.128,proxy

# TFTP root
# enable-tftp
# tftp-root=/srv/tftp

# CHANGE THIS explicit server ip
dhcp-boot=start4.elf,,198.111.226.173

pxe-service=0,"Raspberry Pi Network Boot",start4.elf
```
## TFTP Files Setup
```sh
wget https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04.4-preinstalled-server-arm64+raspi.img.xz

xz -d ubuntu-24.04.4-preinstalled-server-arm64+raspi.img.xz

fdisk -l ubuntu-24.04.4-preinstalled-server-arm64+raspi.img

Disk ubuntu-24.04.4-preinstalled-server-arm64+raspi.img: 3.86 GiB, 4139719168 bytes, 8085389 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0xa06488b5

Device                                              Boot   Start     End Sectors  Size Id Type
ubuntu-24.04.4-preinstalled-server-arm64+raspi.img1 *       2048 1050623 1048576  512M  c W95 FAT32 (LBA)
ubuntu-24.04.4-preinstalled-server-arm64+raspi.img2      1050624 8085387 7034764  3.4G 83 Linux
```
- Mounting
```sh
sudo losetup -Pf --show ubuntu-24.04.4-preinstalled-server-arm64+raspi.img
```
- In this case this returns `/dev/loop0`, which means files are in the FAT partition (partition 1) not the root partition so:
```sh
sudo mkdir -p /mnt/ubuntu-boot
sudo mount /dev/loop0p1 /mnt/ubuntu-boot
```
- Note location can differ, so look carefully at `losetup` output
- Copying over files to `/srv/tftp`
```sh
sudo cp bcm2711-rpi-4-b.dtb config.txt cmdline.txt fixup4.dat initrd.img start4.elf vmlinuz /srv/tftp/
sudo cp -r overlays/ /srv/tftp/
```
- Remove the `img` extension from `initrd.img`
```
/srv/tftp  
├── bcm2711-rpi-4-b.dtb  
├── cmdline.txt  
├── config.txt  
├── fixup4.dat
├── initrd  
├── start4.elf
├── vmlinuz
└── overlays/
```
- Unmounting and unlooping
```sh
sudo umount /mnt/ubuntu-boot
sudo losetup -d /dev/loop0
```
- Autoinstall mods for `cmdline.txt`
```
console=serial0,115200 multipath=off dwc_otg.lpm_enable=0 console=tty1 root=LABEL=writable rootfstype=ext4 rootwait fixrtc ip=dhcp autoinstall ds=nocloud-net;s=http://198.111.226.173/autoinstall/
```
- Default file from image:
```
console=serial0,115200 multipath=off dwc_otg.lpm_enable=0 console=tty1 root=LABEL=writable rootfstype=ext4 rootwait fixrtc
```
## Web Setup
- Autoinstall http endpoint
```
http://198.111.226.173/autoinstall/user-data
http://198.111.226.173/autoinstall/meta-data
```
- Serve the same template to all nodes, hostnames are generated dynamically from the NIC MAC during provisioning
- Filetree (file contents specified below)
```
/srv/autoinstall
├── templates/
|   ├── user-data.j2
|   └── meta-data.j2
├── scripts/
|   └── setup.sh
├── inventory.yml
└── render.py
```
- Jinja template for what is served to `/autoinstall/user-data` -> `user-data.j2`
```yaml
#cloud-config
autoinstall:
	version: 1
	identity:
		hostname: provisional
		username: ubuntu
		password: "{{ password_hash }}"
		
	ssh:
		install-server: true
		allow-pw: false
		authorized-keys:
			- "{{ ssh_key }}"
			  
	storage:
		layout:
			name: direct
			
	packages:
		- curl
		- git
	
	late-commands:
		- curtin in-target --target=/target -- \
			  curl -fsSL http://141.211.5.230/scripts/setup.sh \
			  -o /root/setup.sh
		
		- curtin in-target --target=/target -- \
			  chmod +x /root/setup.sh
			  
		- curtin in-target --target=/target -- \
			  /root/setup.sh
```
- `meta-data`
```yaml
instance-id: pi-autoinstall
local-hostname: provisional
```
- Flask renderer `render.py`
```python
from flask import Flask, Response 
from jinja2 import Template 

app = Flask(__name__)

with open("templates/user-data.j2") as f:
	template = Template(f.read())
	
PASSWORD_HASH = ""
SSH_KEY = "my pxe pubkey"

@app.route("/autoinstall/user-data")
def user_data():
	return Response(
		template.render(
			password_hash=PASSWORD_HASH,
			ssh_key=SSH_KEY
		), 
		mimetype="text/plain"
	)
		
@app.route("/autoinstall/meta-data")
def meta_data():
	return Response(
		"instance-id: pi-autoinstall\nlocal-hostname: provisional\n",
		mimetype="text/plain"
	)
	
# must be running for conversion process, daemonize later
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```
- Daemonize (at /etc/systemd/system/pxe-render.service)
```
[Unit]
Description=”PXE-Render”

[Service]
Restart=always
WorkingDirectory=/srv/autoinstall/
ExecStart=/usr/bin/python3 render.py

[Install]
WantedBy=multi-user.target
```
- Ensure that templating works by curling the endpoint from pis
- Edits to `/etc/nginx/nginx.conf`:
```
events {  
	worker_connections 1024; 
}

http {
	server {
	    listen 80;
	    server_name pxeserver;
	
	    # autoinstall API
	    location /autoinstall/ {
	        proxy_pass http://127.0.0.1:5000;
	        proxy_set_header Host $host;
	        proxy_set_header X-Real-IP $remote_addr;
	    }
	
	    # provisioning scripts
	    location /scripts/ {
	        alias /srv/autoinstall/scripts/;
	        autoindex off;
	        default_type text/plain;
	    }
	
	    # logs
	    access_log /var/log/nginx/pxe_access.log;
	    error_log  /var/log/nginx/pxe_error.log;
	}
}
```
- Provisioning script `setup.sh`
```sh
#!/usr/bin/env bash
set -euxo pipefail

MAC=$(cat /sys/class/net/eth0/address)
HOSTNAME="pi-${MAC//:/}"

hostnamectl set-hostname "$HOSTNAME"

apt-get update
apt-get -y upgrade

touch /etc/fleet-provisioned
```
- Double checking ownership of tftp, should be set
```sh
ps aux | grep in.tftpd
root      164972  0.0  0.0   3072   740 ?        Ss   Jun01   0:00 /usr/sbin/in.tftpd --listen --user tftp --address :69 --secure /srv/tftp

grep TFTP_USERNAME /etc/default/tftpd-hpa
TFTP_USERNAME="tftp"

sudo -u tftp ls /srv/tftp
bcm2711-rpi-4-b.dtb  config.txt  initrd    start4.elf
cmdline.txt          fixup4.dat  overlays  vmlinuz
```
- We can later add to the pssid inventory automatically by collecting 
```
hostnamectl hostname
cat /sys/class/net/eth0/address
```

## Troubleshooting
- fixed: dnsmasq is not running because the address is already in use on port 53 (`sudo ss -tulpn | grep :53`, being used by systemd-resolved) -> disable it trying to provide dns in dnsmasq config, changed `DNSStubListener` to no in `/etc/systemd/resolved.conf`
- fixed: not running because port 69 is in use -> in.tftpd, defaults look good so disabled dnsmasq tftp to use default tftp-hpa
```
cat /etc/default/tftpd-hpa
# /etc/default/tftpd-hpa

TFTP_USERNAME="tftp"
TFTP_DIRECTORY="/srv/tftp"
TFTP_ADDRESS=":69"
TFTP_OPTIONS="--secure"
```
- dnsmasq now working
- tracking during supposed network boot on pxe: `sudo journalctl -fu dnsmasq` -> got it working after switching subnet