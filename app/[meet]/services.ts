import axios from "axios";

async function createMeet() {
    try {
        axios.defaults.baseURL = process.env.NEXT_PUBLIC_BASE_URL
        const response = await axios.get("/room/create");
        return response.data
    }
    catch (error) {
        console.log(error);
    }
}



export { createMeet };