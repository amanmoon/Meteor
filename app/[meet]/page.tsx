"use client";
import { createSendTransport } from "./helpers";
import { useEffect, useRef, useState } from "react";

import { Device } from "mediasoup-client";
import { socket } from "../[meet]/services"

export default function Page() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const [videoParams, setVideoParams] = useState({
        encoding: [
            { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" },
            { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
            { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
        ],
        codecOptions: { videoGoogleStartBitrate: 1000 },
    });
    const [audioParams, setAudioParams] = useState({
        encoding: [
            { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
            { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
        ],
        // codecOptions: { videoGoogleStartBitrate: 1000 },
    });

    const [id, setId] = useState<string>('');
    const [video, setVideo] = useState<boolean>(false);
    const [audio, setAudio] = useState<boolean>(false);
    const [device, setDevice] = useState<any>(null);
    const [sendTransport, setSendTransport] = useState<any>(null);
    const [recieveTransport, setrecieveTransport] = useState<any>(null);

    useEffect(() => {
        const id = window.location.href.split('/').pop();
        setId(id);
    }, [])

    const createDevice = () => {
        socket.emit('getRTPcapablities', { id: id }, async (res) => {
            if (!res.error) {
                const rtpCapabilities = res.data;
                const device = await new Device();
                await device.load({ routerRtpCapabilities: rtpCapabilities });
                console.log('device setup complete!');
                setDevice(device);
            } else
                console.log(res.error)
        })
    }

    const setupSendTransport = () => {
        socket.emit('getTransportParams', { id: id }, (res) => {
            if (!res.error) {
                const transportParams = res.data;
                console.log(res);
                const sendTransport = createSendTransport(id, userName, device, transportParams);
                console.log('transport setup complete!')
                setSendTransport(sendTransport);
            } else
                console.log(res.error)
        })
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current && !video) {
                const track = stream.getVideoTracks()[0];
                videoRef.current.srcObject = stream;
                setVideoParams((current) => ({ ...current, track }));
            }
            else {
                videoParams['track'].stop()
                for (const track of stream.getVideoTracks()) {
                    track.stop()
                }
                videoRef.current.srcObject = null;
                setVideoParams((current) => ({ ...current, track: null }));
            }
            setVideo(!video)
        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    };

    const startAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            if (audioRef.current && !audio) {
                const track = stream.getTracks()[0];
                audioRef.current.srcObject = stream;
                setAudioParams((current) => ({ ...current, track }));
            } else {
                audioParams['track'].stop()
                for (const track of stream.getAudioTracks()) {
                    track.stop()
                }
                audioRef.current.srcObject = null;
                setAudioParams((current) => ({ ...current, track: null }));
            }
            setAudio(!audio);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    return (<>
        <button onClick={createDevice}>Create Meet</button>
        <button onClick={setupSendTransport}>setup send transport</button>
        <button onClick={startCamera}>start Cam</button>
        <button onClick={startAudio}>start Audio</button>
        <video ref={videoRef} autoPlay playsInline />
        <audio ref={audioRef} autoPlay playsInline />
        {/* <video ref={remoteVideoRef} id="remotevideo" autoPlay playsInline /> */}
    </>)
}