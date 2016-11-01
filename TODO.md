* resolve dns names before connect/listen
* stored values while sync arrive at sync target
* serialize store to prevent del and set racing
* store updates _next on all
* store delete
* ping pong sys socket to detect net segmentation (because not timeouts on store messages, relying on close promise reject)
* handle master fails immediately after join2
* handle master fails midway through stores sync (perhaps distribute sync)
* sync error should stop member

* incremental test kv distribution
* storage api onto vertex
* func + example (client-server, cluster)
* member/delete after consensus

* why so many Server._session(s) on new cluster member
