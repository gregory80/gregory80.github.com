
Experiments with DNSCrypt and BIND9
========================================


I've been interested in playing with [DNSCrypt](http://www.opendns.com/technology/dnscrypt/) since it was 
released as a Mac client late last year. I installed
the client, but found my own home network was unable to 
leverage the encrytped UDP packets and needed to run over
TCP/443

I emailed OpenDNS, and got a prompt response that it was
most likely an issue with either my router or network. After finally
getting some free time, and interest to play with DNSCrypt
again, this [video](http://www.democracynow.org/2012/4/20/whistleblower_the_nsa_is_lying_us) helped,
I swapped out the default verizon FIOS router with a Linksys e2100L flashed
with the latest [dd-wrt](http://www.dd-wrt.com/wiki/index.php/Linksys_E2100L), all issues were resolved. I'm not exactly sure
what the stock verizon router+firmware were doing, but it definitly offered a lot
of conveneince featues and always promoted me if I was really sure I wanted
to enter the admin section. 

Regardless, with DNSCrypt running smoothly on my Mac, I wanted to
branch out and just drop all DNS requests behind DNSCrypt at the router.

Running dnscrypt-proxy for all DNS queries
------------------------

I looked around for binaries that added dnscrypt-proxy directly on the router, but I
found better support and development efforts behind the linux [dnscrypt-proxy](https://github.com/opendns/dnscrypt-proxy)
and since I have a mostly idle linux server already on my network
it seemed easier to configure. The dnscrypt-proxy man pages specifically advise that the proxy does no caching
and suggests using [unbound](http://unbound.net/documentation/howto_setup.html). For some reason, bind9 was already running
on my host and configured to send traffic to Google DNS servers

    8.8.8.8
    8.8.4.4

Instead of uninstalling it and trying to configure unbound, which may be more secure, I 
caved to laziness and proof of concept. Thanks to this [post](http://www.big-nerds.com/2012/02/17/how-to-use-dns-crypt-with-bind/) I quickly
learned how to foward bind9 to a specifc port. 

The setup is simple, though there is a decent amount of changing configuration on various 
devices to get everything functioning properly. Starting with the linux server

  bind9 0.0.0.0#53
  dnscrypt-proxy 127.0.0.1#40

bind9 is listening on 0.0.0.0 so it can receive queries from the router (configuration below). And since everything
has not only been done, it has probably been blogged about as well, there is a blog post
on running dnscrpyt-proxy under upstart on Ubuntu. This [post](http://www.webupd8.org/2012/02/encrypt-dns-traffic-in-linux-with.html) was 
very handy in getting a quick config file. I ended up tweaking it a bit, adding a PID file, so 
I can monitor it with [monit](http://mmonit.com/monit/).

    description "dnscrypt startup script"

    start on (local-filesystems and started dbus and stopped udevtrigger)
    stop on runlevel [016]

    script
            exec /usr/local/sbin/dnscrypt-proxy -P 40 -a 127.0.0.1 -p /var/run/dnscrpyt-proxy.pid
    end script


To start and stop dnscrypt-proxy under upstart:

    $ sudo start dnscrypt
    $ sudo stop dnscrypt

A command check to make sure dnscrypt-proxy is still running:

    $ ps auxww | grep dns

    root      9213  0.0  0.1   2584  1096 ?        Ss   19:39   0:00 /usr/local/sbin/dnscrypt-proxy -P 40 -a 0.0.0.0 -p /var/run/dnscrpyt-proxy.pid


The fowarders listed in /etc/bind/named.conf.options. This [reference](https://help.ubuntu.com/community/BIND9ServerHowto) for bind9 is handy in tweaking
it the desired specs.

    forwarders {
      127.0.0.1 port 40;
    };

To restart bind9:

    $ sudo /etc/init.d/bind9 restart


Then in my router, I setup my the 1st static DNS to point to the IPaddress of my linux server with bind9 and dnscrypt. Though I already
configured this machine to have a static ipaddress. Essentially, 
replace 8.8.8.8 with your local machine running bind9 ipaddress, for example: 192.168.1.11. I have also setup two fallback
DNS servers to either OpenDNS or google DNS depending on my mood.

The [original reference](http://www.ubuntugeek.com/ubuntu-networking-configuration-using-command-line.html)
and [lastest from google](http://www.howtogeek.com/howto/ubuntu/change-ubuntu-server-from-dhcp-to-a-static-ip-address/) on setting a static ipaddress for 
ubuntu server. And an excerpt from the server interfaces file.


    $ cat /etc/network/interfaces

    # The loopback network interface
    auto lo
    iface lo inet loopback

    # The primary network interface
    auto eth0
    iface eth0 inet static
    address 192.168.1.11
    netmask 255.255.255.0
    gateway 192.168.1.1
    network 192.168.1.0
    broadcast 192.168.1.255
    

That's basically it. bind9 is listening for regular old DNS queries, coming from the router on port 53, so all traffic unless
otherwise specificed, and it passes anything it doesn't have a valid cache record for to dnscrypt, listening
on port 40. dnscrpyt does its thing, making an encrypted query to opendns servers and responding back to the client.
Essentially, now all DNS traffic on my local LAN is now encrypted and a fair bit faster thanks to instroducing
a DNS caching server to my network.

To ensure everything was working okay, I just ran tcpdump to check data was actually flowing to the new services.

To check bind9 is getting data

    sudo tcpdump -nnvvAs 4096 -f -i eth0 port 53

To check dnscrpyt-proxy is getting data
  
    sudo tcpdump -nnvvAs 4096 -f -i lo port 40

Be sure to check ifconfig for the apprpriate interface names on the system you are working with. Oh,
and a quick way to flush DNS cache from OSX

    dscacheutil -flushcache
