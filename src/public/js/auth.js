(async () => {
    const createAuthPromise = () => new Promise(r => {
        try {
            document.getElementById("start_div").classList.remove("start_hide");
        } catch (e) {
        }
        AUTH.isValid = false;
        AUTH.hasAuthenticated = false;
        sk.emit("auth", localStorage.getItem("_token"));
        sk.on("auth", e => {
            AUTH.hasAuthenticated = true;
            window.user = null;
            window.songs = [];
            if (e.success && e.user) {
                AUTH.isValid = true;
                try {
                    document.getElementById("start_div").classList.add("start_hide");
                } catch (e) {
                }
                window.user = e.user;
                window.songs = e.songs;
                Object.keys(songs).forEach((uuid, index) => {
                    songs[uuid].uuid = uuid;
                    songs[uuid].index = index;
                });
            } else localStorage.removeItem("_token");
            if (!AUTH.isValid && AUTH.authRequired) window.location.href = "/";
            else if (window.wasPlaying) {
                window.wasPlaying = false;
                window.playSound();
            }
            r();
        });
    });
    const sk = io();
    window.socket = sk;
    window.user = null;
    window.songs = [];
    window.AUTH = {
        hasAuthenticated: false,
        isValid: false,
        authRequired: false
    };
    let authPromise = createAuthPromise();

    sk.on("opened", () => authPromise = createAuthPromise());
    sk.on("disconnect", () => {
        window.wasPlaying = window.isSongPlaying ? window.isSongPlaying() : false;
        window.pauseSong ? window.pauseSong() : null;
        AUTH.isValid = false;
        AUTH.hasAuthenticated = false;
        try {
            document.getElementById("start_div").classList.remove("start_hide");
        } catch (e) {
        }
    });

    window.auth = function () {
        if (AUTH.hasAuthenticated) return Promise.resolve();
        return authPromise;
    }

    window.authRequired = async function () {
        AUTH.authRequired = true;
        if (!AUTH.hasAuthenticated) await auth();
        if (!AUTH.isValid && AUTH.authRequired) window.location.href = "/";
    }
})();