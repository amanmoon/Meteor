import { socket } from "../[meet]/services"

async function createSendTransport(id, userName, device, transport) {
    try {
        const sendTransport = await device.createSendTransport({
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            sctpParameters: transport.sctpParameters
        });

        sendTransport.on(
            "connect",
            async ({ dtlsParameters }: any, callback: any, errback: any) => {
                try {
                    console.log("----------> producer transport has connected");
                    await socket.emit("transport-connect", { id: id, userName: userName, dtlsParameters: dtlsParameters });
                    callback();
                } catch (error) {
                    errback(error);
                }
            }
        );

        sendTransport.on(
            "produce",
            async (parameters: any, callback: any, errback: any) => {
                const { kind, rtpParameters } = parameters;

                console.log("----------> transport-produce");

                try {
                    socket.emit(
                        "transport-produce",
                        { kind, rtpParameters },
                        ({ id }: any) => {
                            callback({ id });
                        }
                    );
                } catch (error) {
                    errback(error);
                }
            }
        );

        console.log("created sent transport")
        return sendTransport;
    }
    catch (error) {
        if (error.name === 'UnsupportedError')
            console.warn('browser not supported');
    }
}
async function createReciveTransport(device, transport) {
    try {
        const reciveTransport = await device.createRecvTransport({
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            sctpParameters: transport.sctpParameters
        });

        reciveTransport.on(
            "connect",
            async ({ dtlsParameters }: any, callback: any, errback: any) => {
                try {
                    // Notifying the server to connect the receive transport with the provided DTLS parameters
                    await socket.emit("transport-recv-connect", { dtlsParameters });
                    callback();
                } catch (error) {
                    errback(error);
                }
            }
        );

        console.log("created recive transport")
        return reciveTransport;
    } catch (error) {
        if (error.name === 'UnsupportedError')
            console.warn('browser not supported');
    }
}
export { createSendTransport, createReciveTransport };