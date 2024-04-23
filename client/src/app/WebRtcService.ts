// https://webrtc.github.io/samples/
// https://fireship.io/lessons/webrtc-firebase-video-chat/
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
// https://web.dev/articles/webrtc-basics?hl=ru

import {AppService} from "./AppService.ts";

export function initWebRtcService() {
    const servers = {
        iceServers: [{
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] //TODO: custom? https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
        }],
        iceCandidatePoolSize: 10,
    };

    const pc = new RTCPeerConnection(servers);
    let localStream: MediaStream | undefined = undefined;
    let remoteStream: MediaStream | undefined = undefined;

    const webcamButton = document.getElementById("webcamButton")!;
    const webcamVideo = document.getElementById("webcamVideo")! as any;
    const remoteVideo = document.getElementById("webcamVideo")! as any;
    const callButton = document.getElementById("callButton")! as any;

    webcamButton.onclick = async () => {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});

        // Push tracks from local stream to peer connection
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream!);
        });

        // Show stream in HTML video
        webcamVideo.srcObject = localStream;


        remoteStream = new MediaStream();

        // Pull tracks from remote stream, add to video stream
        pc.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream!.addTrack(track);
            });
        };

        remoteVideo.srcObject = remoteStream;
    }


    callButton.onclick = async () => {
        // Get candidates for caller, save to db
        pc.onicecandidate = event => {
            if (event.candidate) {
                AppService.send(JSON.stringify({
                    userId: AppService.getUserId(),
                    candidate: event.candidate.toJSON()
                }))
            }
        };
    }
}
