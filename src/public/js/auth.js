(async () => {
    const sk = io();
    window.socket = sk;
    window.user = null;
    window.songs = [];
    let authenticated = false;
    let checkedAuth = false;
    let authPromise = new Promise(r => {
        sk.emit("auth", localStorage.getItem("_token"));
        sk.on("auth", e => {
            checkedAuth = true;
            if (e.success && e.user) {
                authenticated = true;
                window.user = e.user;
                window.songs = e.songs;
                Object.keys(songs).forEach((uuid, index) => {
                    songs[uuid].uuid = uuid;
                    songs[uuid].index = index;
                });
            } else localStorage.removeItem("_token");
            r();
        });
    });

    window.auth = async function auth() {
        if (checkedAuth) return;
        return await authPromise;
    }

    window.noAuth = async function noAuth() {
        await auth();
        if (user !== null) {
            window.location.href = "/app";
            return new Promise(r => r);
        }
    }
})();