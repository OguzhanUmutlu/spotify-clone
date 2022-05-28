global.dbL = {
    uuid: `CREATE TABLE IF NOT EXISTS uuid (
        i INTEGER PRIMARY KEY,
        uuid INTEGER
    )`,
    user: `
    CREATE TABLE IF NOT EXISTS users (
        uuid INTEGER PRIMARY KEY UNIQUE,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        birth INTEGER NOT NULL,
        gender INTEGER NOT NULL,
        marketingNotifications INTEGER NOT NULL,
        createdTimestamp INTEGER NOT NULL,
        lastLoginTimestamp INTEGER NOT NULL
    )`,
    playLists: `CREATE TABLE IF NOT EXISTS playLists (
        uuid INTEGER PRIMARY KEY,
        "position" INTEGER NOT NULL,
        ownerUuid INTEGER NOT NULL,
        title TEXT NOT NULL,
        songUuids TEXT NOT NULL,
        "public" INTEGER NOT NULL,
        createdTimestamp INTEGER NOT NULL,
        lastModifiedTimestamp INTEGER NOT NULL
    )`,
    sessions: `CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userUuid INTEGER NOT NULL,
        valid INTEGER NOT NULL,
        createdTimestamp INTEGER NOT NULL,
        lastUsedTimestamp INTEGER NOT NULL
    )`
};