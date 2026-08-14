require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function test() {

    try {

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Say hello in one sentence.",
        });

        console.log(response.text);

    } catch (err) {

        console.error("ERROR:");
        console.error(err);

    }

}

test();