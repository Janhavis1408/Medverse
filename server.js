require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

// ==========================================
// BASIC CONFIGURATION
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ROOT = __dirname;

// ==========================================
// USER FILE
// ==========================================

const USERS_FILE = path.join(ROOT, "users.json");

// Make users.json if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

// ==========================================
// USER AUTHENTICATION
// ==========================================

function getUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading users.json:", error);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(
            USERS_FILE,
            JSON.stringify(users, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error("Error saving users:", error);
    }
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return {
        salt,
        hash
    };
}

function verifyPassword(password, salt, storedHash) {
    try {
        const hash = crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

        return crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(storedHash, "hex")
        );
    } catch (error) {
        return false;
    }
}

// ==========================================
// SIGN UP
// ==========================================

app.post("/api/signup", (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password
        } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });
        }

        const users = getUsers();

        const existingUser = users.find(
            user =>
                user.email &&
                user.email.toLowerCase() ===
                email.trim().toLowerCase()
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });
        }

        const passwordData = hashPassword(password);

        const newUser = {
            id: crypto.randomUUID(),

            name: name.trim(),

            email: email.trim().toLowerCase(),

            phone: phone.trim(),

            passwordHash: passwordData.hash,

            passwordSalt: passwordData.salt,

            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        saveUsers(users);

        console.log(
            "New user created:",
            newUser.email
        );

        return res.status(201).json({
            success: true,
            message:
                "Account created successfully!"
        });

    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to create account."
        });
    }
});

// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter your email and password."
            });
        }

        const users = getUsers();

        const user = users.find(
            user =>
                user.email &&
                user.email.toLowerCase() ===
                email.trim().toLowerCase()
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const passwordCorrect = verifyPassword(
            password,
            user.passwordSalt,
            user.passwordHash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        console.log(
            "User logged in:",
            user.email
        );

        return res.json({
            success: true,

            message: "Login successful!",

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to login."
        });
    }
});

// ==========================================
// OVERPASS API PROXY
// ==========================================
// IMPORTANT:
// Browser -> MedVerse server -> Overpass
//
// This prevents the browser from directly
// calling Overpass and getting a CORS error.
// ==========================================

app.get("/api/nearby-places", async (req, res) => {
    try {
        const { lat, lon, type } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: "Latitude and longitude are required."
            });
        }

        const latitude = Number(lat);
        const longitude = Number(lon);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return res.status(400).json({
                error: "Invalid coordinates."
            });
        }

        const radius = 5000;

        let query;

        if (type === "pharmacy") {
            query = `
[out:json][timeout:25];

(
  node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
  way["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
  relation["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
);

out center tags;
`;
        } else {
            query = `
[out:json][timeout:25];

(
  node["amenity"="hospital"](around:${radius},${latitude},${longitude});
  way["amenity"="hospital"](around:${radius},${latitude},${longitude});
  relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
);

out center tags;
`;
        }

        /*
         * Try multiple public Overpass servers.
         * If one is busy/unavailable, try the next one.
         */

        const overpassServers = [
            "https://overpass.private.coffee/api/interpreter",
            "https://overpass-api.de/api/interpreter"
        ];

        let lastError = null;

        for (const server of overpassServers) {

            try {

                console.log(
                    `🌍 Trying Overpass server: ${server}`
                );

                const response = await fetch(
                    server,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded",

                            "User-Agent":
                                "MedVerse/1.0"
                        },

                        body:
                            "data=" +
                            encodeURIComponent(query),

                        signal:
                            AbortSignal.timeout(30000)
                    }
                );

                console.log(
                    `Overpass response: ${response.status}`
                );

                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.log(
                        `Overpass ${server} failed:`,
                        errorText.slice(0, 500)
                    );

                    lastError =
                        new Error(
                            `Overpass returned ${response.status}`
                        );

                    continue;
                }

                const data =
                    await response.json();

                console.log(
                    `✅ Overpass success: ${data.elements?.length || 0} places`
                );

                return res.json(data);

            } catch (error) {

                console.error(
                    `❌ Overpass server failed: ${server}`,
                    error.message
                );

                lastError = error;
            }
        }

        /*
         * All Overpass servers failed.
         */

        console.error(
            "❌ All Overpass servers failed:",
            lastError
        );

        return res.status(502).json({
            error:
                "Nearby healthcare service is temporarily unavailable."
        });

    } catch (error) {

        console.error(
            "Nearby places route error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to search nearby healthcare locations."
        });
    }
});

// ==========================================
// GROQ AI
// ==========================================

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,

    baseURL:
        "https://api.groq.com/openai/v1"
});

// ==========================================
// AI CHAT
// ==========================================

app.post("/chat", async (req, res) => {
    console.log("Chat request received");

    try {
        const {
            message,
            language
        } = req.body;

        if (!message) {
            return res.status(400).json({
                reply:
                    "Please enter a message."
            });
        }

        const languageInstruction =
            language === "hi-IN"
                ? "Reply completely in Hindi (हिन्दी). Use simple, natural Hindi. Do not reply in English unless the user asks for English."
                : "Reply completely in English. Use simple, clear English.";

        console.log(
            "Sending request to Groq..."
        );

        const completion =
            await client.chat.completions.create({

                model:
                    "llama-3.3-70b-versatile",

                temperature: 0.5,

                max_tokens: 300,

                messages: [

                    {
                        role: "system",

                        content: `

You are Dr. MedVerse AI.

You are a professional virtual healthcare assistant.

${languageInstruction}

Rules:

- Give educational health information only.
- Never diagnose diseases.
- Be friendly, calm and supportive.
- Recommend consulting a doctor for persistent or severe symptoms.
- If the user mentions chest pain, difficulty breathing, stroke symptoms, unconsciousness, severe bleeding or any medical emergency, immediately advise them to seek emergency medical care.
- Keep responses between 80 and 150 words.
- Use bullet points whenever helpful.
- Never claim to be a real doctor.
- End every response with:

"This information is educational and is not a substitute for professional medical advice."

`
                    },

                    {
                        role: "user",

                        content: message
                    }
                ]
            });

        console.log(
            "Groq replied successfully"
        );

        const reply =
            completion
                .choices?.[0]
                ?.message
                ?.content ||
            "Sorry, I couldn't generate a response.";

        return res.json({
            reply
        });

    } catch (error) {
        console.error(
            "========== GROQ ERROR =========="
        );

        console.error(error);

        return res.status(500).json({
            reply:
                "Sorry, MedVerse AI is currently unavailable."
        });
    }
});

// ==========================================
// FRONTEND
// ==========================================

// Serve ALL frontend files:
// HTML
// CSS
// JS
// PNG
// JPG
// etc.
//
// Express automatically gives CSS/JS/images
// the correct MIME types.

app.use(
    express.static(ROOT)
);

// ==========================================
// HOMEPAGE
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(ROOT, "index.html")
    );
});

// ==========================================
// OPTIONAL HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "MedVerse server is running."
    });
});

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
    res.status(404).send(
        "MedVerse: Page not found."
    );
});

// ==========================================
// SERVER
// ==========================================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `MedVerse AI Server running on port ${PORT}`
    );
});