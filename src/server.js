const fs = require("fs/promises");
const io = require("socket.io");
const express = require("express");
const app = express();
const http = new (require("http")).Server(app);
global.sqdb = require("better-sqlite3")("./data.db");
require("./API");


app.use((req, res, next) => {
    if (req.url.split("/").pop().endsWith(".html")) return;
    next();
});

app.use(express.static("src/public"));
app.use(express.static("assets"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/oturuma%C3%A7", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

app.get("/kaydol", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
});

app.get("/app", (req, res) => {
    res.sendFile(__dirname + "/public/app.html");
});

const {Socket} = require("socket.io");

/*** @type {Object<number, Socket>} */
const clients = {};
let _client_id = 0;
global.songs = {};

async function updateSongs() {
    const newSongs = {};
    /*** @type {Object<number, {file: string, iconFile: string | null, artist: string | number, title: string, lyrics: Object<number, string> | string[], date: number | string, time: number}>} */
    const json = JSON.parse(await fs.readFile("./songs.json", "utf8"));
    for (const uuid in json) {
        const f = require("fs");
        const song = json[uuid];
        if (f.existsSync(`./assets/songs/${song.file}`)) {
            if (!f.existsSync(`./assets/icons/${song.iconFile}`)) song.iconFile = null;
            const duration = await require("./mp3")(await fs.readFile(`./assets/songs/${song.file}`));
            if (duration !== -1) {
                song.time = duration;
                newSongs[uuid] = song;
            }
        } else console.error(song.file + " not found!");
    }
    global.songs = newSongs;
    setTimeout(updateSongs, 10000);
}

updateSongs().then(() => {
    // noinspection JSValidateTypes
    io(http).on("connection", sk => {
        sk._uuid = _client_id++;
        sk._userToken = null;
        sk._connected = true;
        sk.emit("opened");
        clients[sk._uuid] = sk;
        sk._getUser = (token = sk._userToken) => {
            let session = API.db.getSession(token);
            return session ? API.db.getUser(session["userUuid"]) : null;
        };
        sk.on("auth", async token => {
            if (!sk._connected) return;
            if (token) {
                const user = sk._getUser(token);
                if (user) {
                    sk._userToken = token;
                    const account = {};
                    ["uuid", "username", "email", "password", "birth", "gender", "createdTimestamp", "lastLoginTimestamp"].forEach(i => account[i] = user[i]);
                    account.playLists = API.db.getPlayListsByUserJSON(user);
                    delete account.password;
                    sk.emit("auth", {success: true, user: account, songs});
                    API.db.updateSessionLastUse(token);
                } else {
                    sk.emit("auth", {success: false});
                    sk._connected = false;
                }
            } else {
                sk.emit("auth", {success: true});
                sk._userToken = false;
            }
        });
        sk.on("add_playlist", e => {
            const user = sk._getUser();
            if (!user || !sk._connected || !e) return;
            const pLC = Object.values(API.db.getPlayListsByUser(user)).length;
            if (pLC > 10) return sk.emit("add_playlist", {success: false, error: "PLAYLIST_LIMIT_10"});
            API.db.addPlayList(user["uuid"], e.title, Date.now(), []);
            sk.emit("add_playlist", {success: true, playLists: API.db.getPlayListsByUserJSON(user)});
        });
        sk.on("remove_playlist", e => {
            const user = sk._getUser();
            if (!user || !sk._connected || !e) return;
            API.db.removePlayList(user["uuid"], e.uuid);
        });
        sk.on("fetch_playlist", e => {
            const user = sk._getUser();
            if (!user || !sk._connected || !e) return;
            const pL = API.db.getPlayList(e.uuid);
            const pLJ = pL.toJSON();
            delete pLJ.position;
            if (pL && (!pL.public || pL.ownerUuid === user.uuid)) sk.emit("fetch_playlist", {
                uuid: e.uuid,
                success: true,
                playlist: pLJ
            });
            else sk.emit("fetch_playlist", {uuid: e.uuid, success: false});
        });
        sk.on("disconnect", () => {
            delete clients[sk._uuid];
            sk._connected = false;
        });
        sk.on("register", json => {
            if (sk._userToken || !sk._connected) return;
            if (typeof json !== "object") return;
            const alerts = {};
            const alertTo = (a, b) => alerts[a] = b;
            const n = r => json[r];
            //const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/;
            const emailRegex = /([a-zA-Z\d._]){8,40}@([a-zA-Z\d-_]{2,28}\.){1,4}[a-zA-Z\d-_]{2,28}/;
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&\/\\+\-()~`'"#^>£½{₺}¨.:;<|€]{8,}$/;
            const expected = {
                "email": "",
                "email_repeat": "",
                "username": "",
                "password": "",
                "password_repeat": "",
                "birth": 1,
                "gender": 1,
                "marketing": true
            };
            let d;
            if (
                Object.keys(expected).some(i => (!n(i) && n(i) !== 0 && n(i) !== false) || typeof n(i) !== typeof expected[i]) ||
                ![0, 1, 2].includes(n("gender")) || !(d = new Date(n("birth"))) || !d.getTime() ||
                d.getFullYear() > (new Date()).getFullYear() || d.getFullYear() < (new Date()).getFullYear() - 164 ||
                d.getFullYear() > (new Date()).getFullYear() - 13 || !emailRegex.test(n("email")) ||
                n("email") !== n("email_repeat") || /^[a-zA-Z\d]+$/.test(n("username")) === false ||
                n("username").length < 4 || n("username").length > 16 || n("password").length < 8 ||
                n("password").length > 100 || n("password") !== n("password_repeat") ||
                !passRegex.test(n("password"))
            ) return sk.emit("register", {
                success: false,
                alerts
            });
            if (API.db.getUserByUsername(n("username"))) alertTo("username", true);
            if (API.db.getUserByEmail(n("email"))) alertTo("email", true);
            if (Object.keys(alerts).length > 0) return sk.emit("register", {
                success: false,
                alerts
            });
            else {
                API.db.createUser(n("username"), n("email"), n("password"), n("birth"), n("gender"), n("marketing"));
                sk.emit("register", {
                    success: true,
                    email: n("email")
                });
            }
        });
        sk.on("login", json => {
            if (sk._userToken || !sk._connected) return;
            if (typeof json !== "object") return;
            const n = r => json[r];
            const expected = {
                "username": "",
                "password": ""
            };
            if (Object.keys(expected).some(i => typeof expected[i] !== typeof n(i)) || n("username").length > 100 || n("password").length > 100) return sk.emit("login", {success: false});
            const user = API.db.getUserByEmail(n("username")) || API.db.getUserByUsername(n("username"));
            let wr = false;
            if (!user || user.password !== n("password")) wr = true;
            if (wr) sk.emit("login", {
                success: false,
                error: true
            });
            else sk.emit("login", {
                success: true,
                token: API.db.createSession(user.uuid)
            });
        })
    });
    http.listen(80);
});