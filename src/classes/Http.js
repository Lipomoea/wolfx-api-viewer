import axios from "axios";

class Http {
    static async get(url) {
        try {
            const res = await axios.get(url)
            return res.data
        }
        catch (err){
            console.log(err);
        }
    }
    static async post(url, data) {
        try {
            const res = await axios.post(url, data)
            return res.data
        }
        catch (err){
            console.log(err);
        }
    }
}

export default Http;