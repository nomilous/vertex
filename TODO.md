* update delete member (to not retry) after keystore retry (on lost master) implemented 
* seamless master failover will mid store set/del action
* optional ping pong into vertex transport
* resolve dns names before connect/listen? (or can member address be hostname?)
* stored values while sync arrive at sync target
* serialize store to prevent del and set racing
* store updates _next on all
* store delete
* (build into vertex-transport) ping pong sys socket to detect net segmentation (because not timeouts on store messages, relying on close promise reject)
* handle master fails immediately after join2
* handle master fails midway through stores sync (perhaps distribute sync)
* sync error should stop member

* incremental test kv distribution
* storage api onto vertex
* func + example (client-server, cluster)
* member/delete after consensus

* proper count of members
* subscribe to error until something else does
* attempt reconnect lost cluster sockets (with timeout)
