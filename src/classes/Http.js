import axios from "axios";

class Http {
    static async get(url, config = { timeout: 30000 }) {
        try {
            const res = await axios.get(url, config)
            return res.data
        }
        catch (err){
            console.log(err);
        }
    }
    static async post(url, data, config = { timeout: 30000 }) {
        try {
            const res = await axios.post(url, data, config)
            return res.data
        }
        catch (err){
            console.log(err);
        }
    }
}

export default Http;