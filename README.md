# MXVC - Matrix Voice Channels

Discord like Voice Channels for Matrix

## State

The `de.mtorials.test.callstate` event is a state event and gives information about the peer and wether the peer is `joined`.
Example event:

```json
{
    "type": "de.mtorials.test.callstate",
    "sender": "@mtorials:mtorials.de",
    "state_key": "chrome@mtorials:mtorials.de", // device_name and fully qualified user id
    "content": {
        "join_state": "JOINED" // can be: JOINED, LEFT
    }
}
```
If a device wants to join the channel, it sends a callstate event with the `join_state` set to `JOINED` and waits for other devices. Every device that also wants to join the channel has to do the same.

In order to leave the channel the state has to be set to `LEFT`.

## Establishing the Peer Connection

In order to connect to the channel the device need to establish a peer connection to every other joined device. For every connected device but itself it sends a `de.mtorials.test.call` message event. The body of the message event must contain the WebRTC offer and the `rtc_type` has to be set accordingly. The content must also contain the sender and the receiver device.

```json
{
    "type": "de.mtorials.test.call",
    "sender": "@test:mtorials.de",
    "content": {
        "rtc_type": "offer",
        "sender": "firefox@test:mtorials.de",
        "receiver": "chrome@mtorials:mtorials.de",
        "body": "<actual webrtc offer>"
    }
}
```

Every connection then needs to answer the offer. This happens in a very similar way.

```json
{
    "type": "de.mtorials.test.call",
    "sender": "@mtorials:mtorials.de",
    "content": {
        "rtc_type": "answer",
        "sender": "chrome@mtorials:mtorials.de",
        "receiver": "firefox@test:mtorials.de",
        "body": "<actual webrtc answer>"
    }
}
```

To establish the connection now every device needs to send the ICE candidates. This happens with the same event, but the `receiver` is not necessary here:

```json
{
    "type": "de.mtorials.test.call",
    "sender": "@test:mtorials.de",
    "content": {
        "rtc_type": "candidate",
        "sender": "firefox@test:mtorials.de",
        "body": "<webrtc candidate>"
    }
}
```

## Limitations

Exponential connections....