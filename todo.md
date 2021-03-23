# TODO

* create Map for each Peer: sender_key -> { peerConnection, video-elmenet-id }
* on incoming
    * if offer -> create new entry in map
    * else get entry in map
* are ice cands working for every connection? -> If not, they need a receiver
* In template: iterate over map?