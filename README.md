# MXVC - Matrix Voice Channels

Discord like Voice Channels for Matrix.

## State

The `de.mtorials.test.callstate` event is a state event and gives information about the peer and if the peer is joined.
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

In order to connect to the channel the device need to establish a peer connection to every other joined device. For every connected device but itself __the device joining__ sends a `de.mtorials.test.call` message event. The body of the message event must contain the WebRTC offer and the `rtc_type` has to be set accordingly. The content must also contain the sender and the receiver device.

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

## Timeout

It could lead to problems when users disconnect without setting the `join_state` to `LEFT`. In this case new devices will try to connect to offline devices. One way to work around this problem is to introduce a timestamp in the state event. The user would need to update the state before a given timeout, otherwise other devices would treat the device as being offline:

```json
{
    "type": "de.mtorials.test.callstate",
    "sender": "@mtorials:mtorials.de",
    "state_key": "chrome@mtorials:mtorials.de", // device_name and fully qualified user id
    "content": {
        "join_state": "JOINED", // can be: JOINED, LEFT
        "timestamp": "293823423423424" // Epoch time ms
    }
}
```

```ts
const timeout = 10000
let remoteJoinState = callStateEVent.body.join_state
if (callStateEvent.body.timestamp < now() - timeout) remoteJoinState = 'LEFT'
```

## Bots

Bots that join voice channels are very possible with this method. (maybe implementation in dial-phone?)