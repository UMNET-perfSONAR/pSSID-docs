# Manual Docker Install

Instructions for installing a containerized version of the daemon

## Install Docker
```shell
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

If the machine was previously running the daemonized version:
```shell
systemctl stop pssid-daemon
ip netns del pssid_wlan0
```
## Filetree
1. Clone the repo
```shell
git clone https://github.com/UMNET-perfSONAR/pssid-docker.git
```
2. Ensure this is the filetree layout
```
.
├── Dockerfile
├── entrypoint.sh
├── pssid_config.json              
└── wpa_supplicant/
    └── wpa_supplicant_{ssid}.conf # can add multiple confs
```

3. Complete the following in the above indicated directory with elevated privileges:
## Build
```shell
docker build -t pssid-daemon .
```

## Run
- Here we are binding the actual host `/var/log/pssid.log` file so the container can remain immutable
- tmpfs mounts because read only breaks rsyslog write functionality otherwise
> [!NOTE]
> This requires the file to exist on the host, or else it will be created as a directory and not work - ensure `/var/log/pssid.log` exists

```shell
docker run -d \
  --name pssid-daemon \
  --network host \
  --privileged \
  --restart unless-stopped \
  --read-only \
  --tmpfs /run \
  --tmpfs /var/spool/rsyslog \
  -v ./pssid_config.json:/etc/pssid/pssid_config.json:ro \
  -v ./wpa_supplicant:/etc/wpa_supplicant:ro \
  -v /var/log/pssid.log:/var/log/pssid.log \
  pssid-daemon --config /etc/pssid/pssid_config.json
```

- If instead you want only the container log file to change uncomment the indicated `VOLUME` line in the Dockerfile and run the following
```shell
docker run -d \
  --name pssid-daemon \
  --network host \
  --privileged \
  --restart unless-stopped \
  -v ./pssid_config.json:/etc/pssid/pssid_config.json:ro \
  -v ./wpa_supplicant:/etc/wpa_supplicant:ro \
  -v pssid-logs:/var/log \
  pssid-daemon --config /etc/pssid/pssid_config.json
```

## Logs
Syslog (using host log file)
```shell
tail -f /var/log/pssid.log
```

Syslog (using docker log file, this will be the mirror of the host file if that is chosen as well)
```shell
docker exec pssid-daemon tail -f /var/log/pssid.log
```

Python script logs (debugging purposes)
```
docker logs -f pssid-daemon
```

## Other Commands
Stop and remove the container
```
docker stop pssid-daemon
docker rm pssid-daemon
```

View container process
```
docker ps
```

## Troubleshooting
Layer 2 issues -> wireless interface is probably hidden
- check
```
docker run --rm --network host --privileged --entrypoint bash pssid-daemon -c "iw dev"
docker run --rm --network host --privileged --entrypoint bash pssid-daemon -c "ls /sys/class/net/"
docker run --rm --network host --privileged --entrypoint bash pssid-daemon -c "ls /sys/class/ieee80211/"
```
- If this is the issue, the output will not include wireless interfaces
- Check on the host
```
ip netns list
pssid_wlan0 (id: 0)

ip netns exec pssid_wlan0 iw dev
phy#0
        Interface wlan0
                ifindex 3
                wdev 0x1
                addr dc:a6:32:07:63:48
                type managed
                channel 120 (5600 MHz), width: 40 MHz, center1: 5590 MHz
```
- In the above case pssid_wlan0 was still set
- Delete it to free the wireless interface
```
ip netls del pssid_wlan0
```

