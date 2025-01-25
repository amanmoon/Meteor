import axios from "axios";


async function createMeet() {
    try {
        const response = await axios.get("http://localhost:8080/room/create");
        return response.data
    }
    catch (error) {
        console.log(error);
    }
}

// async function getTransportParams(socket, id: string) {

// }

// async function getRtpCapablities(socket, id: string) {

// }


export { createMeet };