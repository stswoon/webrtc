// https://webrtc.github.io/samples/
// https://fireship.io/lessons/webrtc-firebase-video-chat/
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
// https://web.dev/articles/webrtc-basics?hl=ru

import {AppService} from "./AppService.ts";
import {AppState} from "./AppStateModels.ts";

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
    const answerButton = document.getElementById("answerButton")! as any;

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
        //listen answers
        AppService.onProcessStateChange(async (appState: AppState) => {
            const foundUser = appState.users.find(user => user.id != AppService.getUserId())
            // Listen for remote answer
            if (!pc.currentRemoteDescription && foundUser?.answer) {
                const answerDescription = new RTCSessionDescription(foundUser.answer);
                await pc.setRemoteDescription(answerDescription);
            }

            // Listen for remote ICE candidates
            if (foundUser?.candidate) {
                const candidate = new RTCIceCandidate(foundUser?.candidate);
                await pc.addIceCandidate(candidate);
            }
        })


        // Get candidates for caller, save to db
        pc.onicecandidate = event => {
            if (event.candidate) {
                AppService.send(JSON.stringify({
                    userId: AppService.getUserId(),
                    candidate: event.candidate.toJSON()
                }))
            }
        };


        // Create offer
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };
        AppService.send(JSON.stringify({
            userId: AppService.getUserId(),
            offer
        }));


    }

    answerButton.onclick = async () => {
        pc.onicecandidate = event => {
            if (event.candidate) {
                AppService.send(JSON.stringify({
                    userId: AppService.getUserId(),
                    candidate: event.candidate.toJSON()
                }))
            }
        };

        AppService.onProcessStateChange(async (appState: AppState) => {
            const foundUser = appState.users.find(user => user.id != AppService.getUserId());
            if (foundUser) {
                if (!foundUser.offer) {
                    throw new Error("empty offer")
                }
                const offerDescription = foundUser.offer!;
                await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
                const answerDescription = await pc.createAnswer();
                await pc.setLocalDescription(answerDescription);
                const answer = {
                    type: answerDescription.type,
                    sdp: answerDescription.sdp,
                };
                AppService.send(JSON.stringify({
                    userId: AppService.getUserId(),
                    answer
                }))

                // Listen to offer candidates
                if (foundUser?.offer) {
                    const candidate = new RTCIceCandidate(foundUser?.offer);
                    await pc.addIceCandidate(candidate);
                }
            }
        });
    }
}
