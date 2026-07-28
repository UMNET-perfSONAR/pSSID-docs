# Daemon Troubleshooting

## Layer 2 Errors
1. Start by running `wpa_supplicant` by hand and check for errors. This is what the `pssid-80211` code uses.
```
wpa_supplicant -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant_<SSID>.conf
```
2. If wlan0 is not found, the network namespace is still enabled and needs to be deleted 
3. Start by stopping the daemon
```
systemctl stop pssid-daemon.service
```
4. List out the network namespaces and delete the namespace holding wlan0 (it is likely named pssid_wlan0)
```
ip netns list
ip netns delete pssid_wlan0
```
5. You can alternatively choose to keep the namespace and run commands through it like this `ip netns exec pssid_wlan0 command_here`
6. Rerun the `wpa_supplicant` command, there might be a problem with the config syntax
## Editing WPA Config
1. If it is just the formatting that needs to be changed, that can be done by modifying `ansible-playbook-pssid-daemon/roles/ansible-role-pssid-VT-tools/templates/wpa_supplicant.conf.j2`
2. If actual variable values need to be changed, you need the vault password and can edit the file `ansible-playbook-pssid-daemon/roles/ansible-role-pssid-VT-tools/defaults/wpa_supplicant_profiles.yml` with the following command
```
ansible-vault edit ansible-playbook-pssid-daemon/roles/ansible-role-pssid-VT-tools/defaults/wpa_supplicant_profiles.yml
```
3. Enter insert mode to edit with `i` and write your changes and exit with `esc` followed by `:wq`
## Layer 3 Errors
1. These are usually layer 2 errors that weren't caught because layer 2 has marginally unhelpful error output and false positives
2. Especially if the error has something to do with a time out waiting for a carrier, it is most likely a layer 2 issue
3. If it truly is layer 3, double check to ensure that both `pssid-80211` and `pssid-dhcp` are executable (you can check with `ls -la` and modify with `chmod +x <file>`)
## Service Not Starting (Restart Limit)
1. This is usually because something is preventing the daemon from running correctly, and systemctl restarts it multiple times in quick succession as essentially gets rate limited by its own configuration
2. Run the daemon code by hand to see if there is any error output
```
cd /usr/bin/pssid
python3 pssid-daemon.py
```
3. A common issue is forgetting to set the hostname to be the IP. Since the service file does not include a hostname parameter for replicability (though it is an option) the hostname is assumed to be the IP
## IP Not Found in Host Group
1. This just means that the IP was not assigned any tasks in the configuration file
2. Go to `/etc/pssid/pssid_config.json` and edit it by hand or through the web GUI to add tasks for the probe specifically
## Testing Outside of Lab
1. You will need a router of some sort and a POE switch
2. Power on the router, connect your laptop to the router's wifi, connect the routers LAN to the POE switch, and connect the pi to the POE switch as well
3. The pi should show up on your router's dashboard as a device which will tell you the IP and allow for ssh
4. This is mostly helpful for armed pis that do not have any ports exposed (no hdmi out or keyboard access)
## Remote Power Cycling + eeprom Flashing
1. Testing new features over ssh that have the potential to break ssh access and make the pi unusable if it's remote
2. Setup power cycling timers (the below is a reboot in 5 minutes):
```
shutdown -r +5
```
3. Sometimes pis do not come back up at all, and flashing eeprom can help with this
4. Plug a blank (or unimportant) SD card into your laptop and bring up the Rasberry Pi Imager
5. Choose Raspberry Pi 4 for the device, OS - Utilities, and SD Card boot, then Storage - SD card and flash
6. Power off the target pi and remove its SD card (be sure not to mix up which card is which)
7. Plug in the eeprom SD card and power the pi on
8. It is done flashing when there is a green screen on the monitor output and/or constant flashing output on the pi LEDs
9. Power the pi off, remove the eeprom SD, replace the original SD, and power the pi back on
