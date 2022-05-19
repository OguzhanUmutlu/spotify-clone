require("./SqliteTables");

class User {
    /**
     * @param {number | Object} uuid
     * @param {string?} username
     * @param {string?} email
     * @param {string?} password
     * @param {number?} birth
     * @param {number?} gender
     * @param {boolean?} marketingNotifications
     * @param {number?} createdTimestamp
     * @param {number?} lastLoginTimestamp
     */
    constructor(uuid, username, email, password, birth, gender, marketingNotifications, createdTimestamp, lastLoginTimestamp) {
        if (typeof uuid === "object") ["username", "email", "password", "birth", "gender", "marketingNotifications", "createdTimestamp", "lastLoginTimestamp", "uuid"].forEach(i => eval(`${i} = uuid.${i}`));
        if (typeof marketingNotifications === "number") marketingNotifications = !!marketingNotifications;
        this.uuid = uuid;
        this.username = username;
        this.email = email;
        this.password = password;
        this.birth = birth;
        this.gender = gender;
        this.marketingNotifications = marketingNotifications;
        this.createdTimestamp = createdTimestamp;
        this.lastLoginTimestamp = lastLoginTimestamp;
    }
}

class PlayList {
    /**
     * @param {number | Object} uuid
     * @param {number?} ownerUuid
     * @param {string?} title
     * @param {string[]?} songUuids
     * @param {number?} createdTimestamp
     * @param {number?} lastModifiedTimestamp
     */
    constructor(uuid, ownerUuid, title, songUuids, createdTimestamp, lastModifiedTimestamp) {
        if (typeof uuid === "object") ["ownerUuid", "title", "songUuids", "createdTimestamp", "lastModifiedTimestamp", "uuid"].forEach(i => eval(`${i} = uuid.${i}`));
        this.uuid = uuid;
        this.ownerUuid = ownerUuid;
        this.title = title;
        this.songUuids = songUuids;
        this.createdTimestamp = createdTimestamp;
        this.lastModifiedTimestamp = lastModifiedTimestamp;
    }
}

sqdb.exec(dbL.uuid);

function generateUUID() {
    if (!sqdb.prepare(`SELECT uuid
                       FROM uuid
                       ORDER BY i DESC LIMIT 1`).get()) {
        sqdb.prepare(`INSERT INTO uuid (i, uuid)
                      VALUES (?, ?)`).run(0, 0);
    }
    const uuid = sqdb.prepare(`SELECT uuid
                               FROM uuid
                               ORDER BY i DESC LIMIT 1`).get().uuid;
    sqdb.prepare(`UPDATE uuid
                  SET uuid = uuid + 1`).run();
    return uuid;
}

sqdb.exec(dbL.user);
sqdb.exec(dbL.playLists);
sqdb.exec(dbL.sessions);

class db {
    static generateUniqueToken() {
        const randoms = "abcdefghijklmnoprstuvyzqwx!'^+%&/()=?_1234567890".split("");
        const generateToken = () => " ".repeat(50).toString().split("").map(() => randoms[Math.floor(Math.random() * randoms.length)]).join("");
        let token;
        while (!token || sqdb.prepare(`SELECT *
                                       FROM sessions
                                       WHERE token = ?`).get(token)) token = generateToken();
        return token;
    }

    static generateUUID() {
        return generateUUID();
    }

    /**
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @param {number} birth
     * @param {number} gender
     * @param {boolean} marketingNotifications
     * @return {User}
     */
    static createUser(username, email, password, birth, gender, marketingNotifications) {
        const uuid = generateUUID();
        const createdTimestamp = Date.now();
        const lastLoginTimestamp = createdTimestamp;
        sqdb.prepare(`INSERT INTO users (uuid, username, email, password, birth, gender, marketingNotifications,
                                         createdTimestamp, lastLoginTimestamp)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?,
                              ?)`).run(uuid, username, email, password, birth, gender, marketingNotifications ? 1 : 0, createdTimestamp, lastLoginTimestamp);
        return new User(uuid, username, email, password, birth, gender, marketingNotifications, createdTimestamp, lastLoginTimestamp);
    }


    /**
     * @param {number} uuid
     * @return {null|User}
     */
    static getUser(uuid) {
        if (!uuid && uuid !== 0) return null;
        const user = sqdb.prepare(`SELECT *
                                   FROM users
                                   WHERE uuid = ?`).get(uuid);
        if (user) return new User(user);
        return null;
    }


    static getUserByUsername(username) {
        const user = sqdb.prepare(`SELECT *
                                   FROM users
                                   WHERE username = ?`).get(username);
        if (user) return new User(user);
        return null;
    }

    static getUserByEmail(email) {
        const user = sqdb.prepare(`SELECT *
                                   FROM users
                                   WHERE email = ?`).get(email);
        if (user) return new User(user);
        return null;
    }


    static getUserByEmailPassword(email, password) {
        const user = sqdb.prepare(`SELECT *
                                   FROM users
                                   WHERE email = ?
                                     AND password = ?`).get(email, password);
        if (user) return new User(user);
        return null;
    }


    static getUsers() {
        const users = sqdb.prepare(`SELECT *
                                    FROM users`).all();
        const usersList = {};
        for (const user of users) usersList[user.uuid] = new User(user);
        return users;
    }


    static updateUser(uuid, rows = {}) {
        const u = this.getUser(uuid);
        if (u) {
            for (const [key, value] of Object.entries(rows)) u[key] = value;
            sqdb.prepare(`UPDATE users
                          SET username               = ?,
                              email                  = ?,
                              password               = ?,
                              birth                  = ?,
                              gender                 = ?,
                              marketingNotifications = ?,
                              createdTimestamp       = ?,
                              lastLoginTimestamp     = ?
                          WHERE uuid = ?`).run(rows.username || u.username, rows.email || u.email, rows.password || u.password, rows.birth || u.birth, rows.gender || u.gender, (rows.marketingNotifications || u.marketingNotifications) ? 1 : 0, rows.createdTimestamp || u.createdTimestamp, rows.lastLoginTimestamp || u.lastLoginTimestamp, uuid);
            return u;
        }
        return null;
    }


    static deleteUser(uuid) {
        sqdb.prepare(`DELETE
                      FROM users
                      WHERE uuid = ?`).run(uuid);
    }

    static addPlayList(ownerUuid, title, createdTimestamp, songUuids = []) {
        const uuid = generateUUID();
        sqdb.prepare(`INSERT INTO playLists (uuid, ownerUuid, title, songUuids, createdTimestamp, lastModifiedTimestamp)
                      VALUES (?, ?, ?, ?,
                              ?)`).run(uuid, ownerUuid, title, songUuids.join("|"), createdTimestamp, createdTimestamp);
        return new PlayList(uuid, ownerUuid, title, songUuids, createdTimestamp, createdTimestamp);
    }

    static getPlayList(uuid) {
        const playList = sqdb.prepare(`SELECT *
                                       FROM playLists
                                       WHERE uuid = ?`).get(uuid);
        if (playList) {
            playList.songUuids = playList.songUuids.split("|").map(uuid => uuid * 1);
            return new PlayList(playList);
        }
        return null;
    }

    static getPlayListsByUser(user) {
        if (user instanceof User) user = user.uuid;
        const playLists = sqdb.prepare(`SELECT *
                                        FROM playLists
                                        WHERE ownerUuid = ?`).all(user);
        const playListsList = {};
        for (const playList of playLists) {
            playList.songUuids = playList.songUuids.split("|").map(uuid => uuid * 1);
            playListsList[playList.uuid] = new PlayList(playList);
        }
        return playListsList;
    }

    static updatePlayList(uuid, rows = {}) {
        const p = this.getPlayList(uuid);
        if (p) {
            for (const [key, value] of Object.entries(rows)) p[key] = value;
            sqdb.prepare(`UPDATE playLists
                          SET ownerUuid             = ?,
                              title                 = ?,
                              songUuids             = ?,
                              createdTimestamp      = ?,
                              lastModifiedTimestamp = ?
                          WHERE uuid = ?`).run(rows.ownerUuid || p.ownerUuid, rows.title || p.title, rows.songUuids || p.songUuids.join("|"), rows.createdTimestamp || p.createdTimestamp, rows.lastModifiedTimestamp || p.lastModifiedTimestamp, uuid);
            return p;
        }
        return null;
    }

    static deletePlayList(uuid) {
        sqdb.prepare(`DELETE
                      FROM playLists
                      WHERE uuid = ?`).run(uuid);
    }

    static addPlayListSong(playListUuid, songUuid) {
        const playList = this.getPlayList(playListUuid);
        if (playList) {
            playList.songUuids.push(songUuid);
            sqdb.prepare(`UPDATE playLists
                          SET songUuids = ?
                          WHERE uuid = ?`).run(playList.songUuids.join("|"), playListUuid);
            return playList;
        }
        return null;
    }

    static removePlayListSong(playListUuid, songUuid) {
        const playList = this.getPlayList(playListUuid);
        if (playList) {
            playList.songUuids.splice(playList.songUuids.indexOf(songUuid), 1);
            sqdb.prepare(`UPDATE playLists
                          SET songUuids = ?
                          WHERE uuid = ?`).run(playList.songUuids.join("|"), playListUuid);
            return playList;
        }
        return null;
    }

    static getPlayListSongIndex(playListUuid, songUuid) {
        const playList = this.getPlayList(playListUuid);
        if (playList) {
            return playList.songUuids.indexOf(songUuid);
        }
        return null;
    }

    static createSession(userUuid) {
        const token = this.generateUniqueToken();
        sqdb.prepare(`INSERT INTO sessions (token, userUuid, valid, createdTimestamp, lastUsedTimestamp)
                      VALUES (?, ?, ?, ?, ?)`).run(token, userUuid, 1, Date.now(), Date.now());
        return token;
    }

    static getSession(token) {

        const session = sqdb.prepare(`SELECT *
                                      FROM sessions
                                      WHERE token = ?
                                        AND valid = 1`).get(token);
        if (session && session["lastUsedTimestamp"] > Date.now() - 1000 * 60 * 60 * 24 * 7) return session;
        return null;
    }

    static invalidateSession(token) {
        sqdb.prepare(`UPDATE sessions
                      SET valid = ?
                      WHERE token = ?`).run(0, token);
    }

    static updateSessionLastUse(token) {
        sqdb.prepare(`UPDATE sessions
                      SET lastUsedTimestamp = ?
                      WHERE token = ?`).run(Date.now(), token);
    }
}

global.API = {
    User, db
}