"use client";
import { useEffect, useRef } from "react";
import { useSession } from 'next-auth/react';
import * as mediasoup from "mediasoup-client";
import io from 'socket.io-client';

export default function Page() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const { data: session, status } = useSession();

    const videoParams = {
        encoding: [
            { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" },
            { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
            { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
        ],
        codecOptions: { videoGoogleStartBitrate: 1000 },
        track: null
    };

    let device;
    let socket;
    // let producer;

    useEffect(() => {
        window.location.href.split('/').pop();
    }, [])

    if (status === 'loading')
        return <p>Loading...</p>;

    if (!session)
        return <p>You are not signed in.</p>;

    function socketPromise(socket) {
        return function (type, data = {}) {
            return new Promise((resolve) => {
                socket.emit(type, data, resolve);
            });
        }
    }
    let socketRequest;

    async function connect() {

        console.log('hello')
        socket = io(process.env.NEXT_PUBLIC_BASE_URL, {
            withCredentials: true,
        });

        socketRequest = socketPromise(socket);

        socket.on('connect', async () => {
            // $txtConnection.innerHTML = 'Connected';
            // $fsPublish.disabled = false;
            // $fsSubscribe.disabled = false;

            const data = await socketRequest('getRouterRtpCapabilities');
            console.log("data: ", data);
            await loadDevice(data);
        });

        socket.on('disconnect', () => {
            // $txtConnection.innerHTML = 'Disconnected';
            // $btnConnect.disabled = false;
            // $fsPublish.disabled = true;
            // $fsSubscribe.disabled = true;
        });

        socket.on('connect_error', (error) => {
            // console.error('could not connect to %s%s (%s)', serverUrl, opts.path, error.message);
            // $txtConnection.innerHTML = 'Connection failed';
            // $btnConnect.disabled = false;
            console.log(error);
        });

        socket.on('newProducer', () => {
            // $fsSubscribe.disabled = false;
        });
    }

    async function loadDevice(routerRtpCapabilities) {
        console.log('loading device')
        try {
            device = new mediasoup.Device();
            await device.load({ routerRtpCapabilities });
        } catch (error) {
            if (error.name === 'UnsupportedError') {
                console.error('browser not supported');
            }
        }
    }

    async function publish() {
        // const isWebcam = (e.target.id === 'btn_webcam');
        // $txtPublish = isWebcam ? $txtWebcam : $txtScreen;

        const data = await socketRequest('createProducerTransport', {
            forceTcp: false,
            rtpCapabilities: device.rtpCapabilities,
        });
        if (data.error) {
            console.error(data.error);
            return;
        }

        const transport = device.createSendTransport(data);
        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            socketRequest('connectProducerTransport', { dtlsParameters })
                .then(callback)
                .catch(errback);
        });

        transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            try {
                const { id } = await socketRequest('produce', {
                    transportId: transport.id,
                    kind,
                    rtpParameters,
                });
                callback({ id });
            } catch (err) {
                errback(err);
            }
        });

        transport.on('connectionstatechange', (state) => {
            switch (state) {
                case 'connecting':
                    // $txtPublish.innerHTML = 'publishing...';
                    // $fsPublish.disabled = true;
                    // $fsSubscribe.disabled = true;
                    break;

                case 'connected':
                    videoRef.current.srcObject = stream;
                    // $txtPublish.innerHTML = 'published';
                    // $fsPublish.disabled = true;
                    // $fsSubscribe.disabled = false;
                    break;

                case 'failed':
                    transport.close();
                    // $txtPublish.innerHTML = 'failed';
                    // $fsPublish.disabled = false;
                    // $fsSubscribe.disabled = true;
                    break;

                default: break;
            }
        });

        let stream;
        try {
            stream = await getUserMedia();
            const track = stream.getVideoTracks()[0];
            videoParams.track = track;
            // check this
            await transport.produce(videoParams);
        } catch (err) {
            // $txtPublish.innerHTML = 'failed';
            console.log(err);
        }
    }
    let video = false;
    let audio = false;

    async function getAudio() {
        audio = !audio;
    }
    async function getVideo() {
        video = !video;
    }

    async function getUserMedia() {
        if (!device.canProduce('video')) {
            console.error('cannot produce video');
            return;
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: video, audio: audio });
        } catch (err) {
            console.error('getUserMedia() failed:', err.message);
            throw err;
        }
        return stream;
    }

    async function subscribe() {
        const data = await socketRequest('createConsumerTransport', {
            forceTcp: false,
        });
        if (data.error) {
            console.error(data.error);
            return;
        }

        const transport = device.createRecvTransport(data);
        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
            socketRequest('connectConsumerTransport', {
                transportId: transport.id,
                dtlsParameters
            })
                .then(callback)
                .catch(errback);
        });

        transport.on('connectionstatechange', async (state) => {
            switch (state) {
                case 'connecting':
                    // $txtSubscription.innerHTML = 'subscribing...';
                    // $fsSubscribe.disabled = true;
                    break;

                case 'connected':
                    // document.querySelector('#remote_video').srcObject = await stream;
                    remoteVideoRef.current.srcObject = await stream;
                    await socketRequest('resume');
                    // $txtSubscription.innerHTML = 'subscribed';
                    // $fsSubscribe.disabled = true;
                    break;

                case 'failed':
                    transport.close();
                    // $txtSubscription.innerHTML = 'failed';
                    // $fsSubscribe.disabled = false;
                    break;

                default: break;
            }
        });

        const stream = consume(transport);
    }

    async function consume(transport) {
        const { rtpCapabilities } = device;
        const data = await socketRequest('consume', { rtpCapabilities });
        const {
            producerId,
            id,
            kind,
            rtpParameters,
        } = data;

        const codecOptions = {};
        const consumer = await transport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        });
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        return stream;
    }


    return (<>
        <video ref={videoRef} autoPlay playsInline />
        <video ref={remoteVideoRef} autoPlay playsInline />

        <audio ref={audioRef} autoPlay playsInline />
        <button onClick={connect}>connect</button>
        <button onClick={publish}>publish</button>
        <button onClick={getVideo}>camera</button>
        <button onClick={getAudio}>audio</button>
        <button onClick={subscribe}>subscribe</button>
        {/* <video ref={remoteVideoRef} id="remotevideo" autoPlay playsInline /> */}
    </>)
}