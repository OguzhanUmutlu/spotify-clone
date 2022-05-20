LanguageManager.refresh();
const requestAnimationFramePromised = () => new Promise(r => requestAnimationFrame(r));
window.onload = async () => {
    for (let i = 0; i < 3; i++) await requestAnimationFramePromised();
    requestAnimationFrame(() => document.getElementById("start_div").classList.add("start_hide"));
}
(async () => {
    await auth();
    if (!user) return window.location.href = "/";
    else {
        let page;
        let percent = 0;
        let mouseDown = false;
        let mouseFocusedLine = false;
        let mouseFocusedLine2 = false;
        let currentPlayList = "default";
        let sound = {
            NO_LOOP: 0,
            LOOP_SELF: 1,
            MIX_LIST: 2,
            LOOP_LIST: 3,

            SPEED_05: 0,
            SPEED_08: 1,
            SPEED_1: 2,
            SPEED_12: 3,
            SPEED_15: 4,
            SPEED_18: 5,
            SPEED_2: 6,
            SPEED_25: 7,
            SPEED_3: 8,
            SPEED_35: 9,

            /*** @type {HTMLAudioElement | null} */
            element: document.createElement("audio"),
            uuid: null,
            playing: false,
            loopType: 0,
            speedType: 2,
            detailUpdate: null,
            hasValidSource: () => !isNaN(sound.element.duration),
            setSource: src => {
                const spd = sound.getSpeed();
                sound.element.src = src;
                sound.setSpeed(spd);
            },
            play: () => {
                if (!sound.hasValidSource() || sound.playing) return;
                sound.element.play();
                sound.playing = true;
            },
            pause: () => {
                if (!sound.hasValidSource() || !sound.playing) return;
                sound.element.pause();
                sound.playing = false;
            },
            toggle: () => {
                if (!sound.hasValidSource()) return;
                if (sound.playing) sound.pause();
                else sound.play();
            },
            setVolume: volume => sound.element.volume = volume,
            getVolume: () => sound.element.volume,
            setTime: time => sound.element.currentTime = time,
            getTime: () => sound.element.currentTime,
            getDuration: () => sound.element.duration,
            update: () => {
                const time_line_progress = document.getElementById("volume_line_progress");
                time_line_progress.style.width = (window.innerWidth * 0.09 * sound.getVolume()) + "px";
                if (sound.getVolume() >= .66) document.getElementById("volume_line_image").src = "assets/sound.png";
                else if (sound.getVolume() >= .33) document.getElementById("volume_line_image").src = "assets/sound-low.png";
                else if (sound.getVolume() > 0) document.getElementById("volume_line_image").src = "assets/sound-lower.png";
                else document.getElementById("volume_line_image").src = "assets/sound-no.png";
                if (sound.hasValidSource()) {
                    setTimeLinePercent(sound.getTime() / sound.getDuration() * 100);
                    document.getElementById("current_time").innerText = formatTime(sound.getTime());
                    document.getElementById("end_time").innerText = formatTime(sound.getDuration());
                    if (sound.detailUpdate !== sound.uuid) {
                        const song = songs[sound.uuid];
                        document.getElementById("song_details_div").innerHTML = `
        <img draggable="false" class="detail_image" src="${song.iconFile ? "icons/" + song.iconFile : "icon/blue-icon.png"}" alt="">
        <div class="detail_name">${song.title}</div>
        <div class="detail_artist">${song.artist}</div>`;
                        sound.detailUpdate = sound.uuid;
                    }
                    document.getElementById("song_details_div").style.display = "block";
                } else document.getElementById("song_details_div").style.display = "none";
                let newTitle = sound.hasValidSource() && sound.playing ? "Holify - " + sound.getName() + " - " + formatTime(sound.getTime()) : "Holify";
                if (document.title !== newTitle) document.title = newTitle;
                if (sound.playing) document.getElementById("pause_image").src = "assets/pause.png";
                else document.getElementById("pause_image").src = "assets/continue.png";
                requestAnimationFrame(sound.update);
            },
            end: () => {
                sound.pause();
                sound.setSource("");
                sound.uuid = null;
            },
            setSpeed: speed => sound.element.playbackRate = speed,
            getSpeed: () => sound.element.playbackRate,
            setSoundLoop: loop => sound.element.loop = loop,
            setLoopType: type => {
                sound.loopType = type;
                sound.setSoundLoop(type === sound.LOOP_SELF);
                document.getElementById("loop_img").src = "assets/" + ["no-loop", "loop", "mix", "list-loop"][type] + ".png";
                document.getElementById("loop_div").setAttribute("data-tooltip", LanguageManager.translate(["no-loop", "loop", "mix-list", "loop-list"][type] + "-tooltip"));
            },
            setSoundType: type => {
                sound.speedType = type;
                sound.setSpeed([0.5, 0.8, 1, 1.2, 1.5, 1.8, 2, 2.5, 3, 3.5][sound.speedType]);
                document.getElementById("speed_img").src = "assets/speedx" + sound.getSpeed().toString().replaceAll(".", "") + ".png";
            },
            changeLoopType: () => sound.setLoopType((sound.loopType + 1) % 4),
            changeSpeedType: () => sound.setSoundType((sound.speedType + 1) % 10),
            isSoundLooping: () => sound.element.loop,
            getName: () => songs[sound.uuid].title
        };

        const updateLineSphere = path => {
            let tld = document.getElementById("time_line_div");
            let rect = tld.getBoundingClientRect();
            if ((path.some(i => i.id === "time_line_div" || i.id === "time_line_progress" || i.id === "time_line_sphere") || (mouseDown && mouseFocusedLine)) && sound.hasValidSource()) {
                document.getElementById("time_line_sphere").style.left = (rect.x + (percent / 100) * rect.width - 3) + "px";
                document.getElementById("time_line_progress").style.backgroundColor = "#1db954";
            } else {
                document.getElementById("time_line_sphere").style.left = "-100%";
                document.getElementById("time_line_progress").style.backgroundColor = "white";
            }
            tld = document.getElementById("volume_line_div");
            rect = tld.getBoundingClientRect();
            if ((path.some(i => i.id === "volume_line_div" || i.id === "volume_line_progress" || i.id === "volume_line_sphere") || (mouseDown && mouseFocusedLine2))) {
                document.getElementById("volume_line_sphere").style.left = (rect.x + sound.getVolume() * rect.width - 3) + "px";
                document.getElementById("volume_line_progress").style.backgroundColor = "#1db954";
            } else {
                document.getElementById("volume_line_sphere").style.left = "-100%";
                document.getElementById("volume_line_progress").style.backgroundColor = "white";
            }
        }

        addEventListener("mousemove", ev => {
            let tld = document.getElementById("time_line_div");
            let rect = tld.getBoundingClientRect();
            updateLineSphere(ev.composedPath());
            if (mouseDown && mouseFocusedLine && sound.hasValidSource()) {
                let percent = (ev.clientX - rect.x) / rect.width;
                if (percent < 0) percent = 0;
                if (percent > 1) percent = 1;
                setTimeLinePercent(percent * 100);
                sound.setTime(percent * sound.getDuration());
            }
            tld = document.getElementById("volume_line_div");
            rect = tld.getBoundingClientRect();
            updateLineSphere(ev.composedPath());
            if (mouseDown && mouseFocusedLine2) {
                let percent = (ev.clientX - rect.x) / rect.width;
                if (percent < 0) percent = 0;
                if (percent > 1) percent = 1;
                sound.setVolume(percent);
            }
        });

        addEventListener("mousedown", ev => {
            mouseDown = true;
            const path = ev.composedPath();
            if (path.some(i => i.id === "time_line_div" || i.id === "time_line_progress") && sound.hasValidSource()) {
                mouseFocusedLine = true;
                const tld = document.getElementById("time_line_div");
                const rect = tld.getBoundingClientRect();
                let percent = (ev.clientX - rect.x) / rect.width;
                if (percent < 0) percent = 0;
                if (percent > 1) percent = 1;
                sound.setTime(percent * sound.getDuration());
                updateLineSphere(path);
            } else mouseFocusedLine = false;
            if (path.some(i => i.id === "volume_line_div" || i.id === "volume_line_progress")) {
                mouseFocusedLine2 = true;
                const tld = document.getElementById("volume_line_div");
                const rect = tld.getBoundingClientRect();
                let percent = (ev.clientX - rect.x) / rect.width;
                if (percent < 0) percent = 0;
                if (percent > 1) percent = 1;
                sound.setVolume(percent);
                updateLineSphere(path);
            } else mouseFocusedLine2 = false;
        });
        addEventListener("mouseup", () => mouseDown = false);
        addEventListener("mouseleave", () => mouseDown = false);
        addEventListener("blur", () => mouseDown = false);

        function formatTime(time) {
            let minutes = Math.floor(time / 60).toString().padStart(2, "0");
            let seconds = Math.floor(time - minutes * 60).toString().padStart(2, "0");
            if (minutes === "NaN") minutes = 0;
            if (seconds === "NaN") seconds = 0;
            return !minutes ? (!seconds ? "00:00" : "00:" + seconds) : (!seconds ? minutes + ":00" : minutes + ":" + seconds);
        }

        sound.element.setAttribute("preload", "auto");
        sound.element.setAttribute("controls", "none");
        sound.element.style.display = "none";
        sound.element.hidden = true;
        sound.element.onended = () => {
            sound.pause();
            switch (sound.loopType) {
                case sound.LOOP_LIST:
                    nextSongInPlayList();
                    break;
                case sound.MIX_LIST:
                    playRandomSongInPlayList();
                    break;
            }
        };
        document.body.appendChild(sound.element);

        sound.update();

        addEventListener("mousemove", ev => {
            const path = ev.composedPath();
            const el = path.find(i => i && i.getAttribute && i.getAttribute("data-tooltip"));
            const tooltip = document.getElementById("tooltip");
            tooltip.style.left = (ev.clientX + 10) + "px";
            tooltip.style.top = (ev.clientY + 10) + "px";
            if (el) {
                tooltip.classList.remove("tooltip_hide");
                tooltip.innerHTML = el.getAttribute("data-tooltip");
                tooltip.style.display = "block";
                return;
            }
            tooltip.classList.add("tooltip_hide");
        });

        window.setPage = r => {
            page = r;
            ["home", "search", "library", "add", "favorite"].forEach(e => {
                document.getElementById(e + "_img").src = "assets/" + e + ".png";
                document.getElementById(e + "_alpha").style.display = "block";
            });
            document.getElementById(page + "_alpha").style.display = "none";
            if (["search", "library", "home"].includes(page)) document.getElementById(page + "_img").src = "assets/hover-" + page + ".png";
        }

        window.setTimeLinePercent = r => {
            const time_line_progress = document.getElementById("time_line_progress");
            percent = r;
            time_line_progress.style.width = (window.innerWidth * 0.32 * (percent / 100)) + "px";
        }

        window.setSound = function setSound(uuid = null, play = false) {
            if (uuid === null) {
                sound.end();
                document.getElementById("pause_alpha").style.display = "block";
                ["speed", "time_next", "song_next", "pause", "song_back", "time_back", "loop"].forEach(e => {
                    document.getElementById(e + "_div").style.cursor = "not-allowed";
                    document.getElementById(e + "_div").style.pointerEvents = "none";
                    document.getElementById(e + "_alpha").classList.add("alpha2_locked");
                });
                document.getElementById("time_line_div").style.cursor = "not-allowed";
                return;
            }
            sound.pause();
            sound.setSource("songs/" + songs[uuid].file);
            if (play) {
                sound.element.oncanplaythrough = () => {
                    sound.play();
                    sound.element.oncanplaythrough = r => r;
                }
            }
            sound.uuid = uuid;
            document.getElementById("pause_alpha").style.display = "none";
            ["speed", "time_next", "song_next", "pause", "song_back", "time_back", "loop"].forEach(e => {
                document.getElementById(e + "_div").style.cursor = "pointer";
                document.getElementById(e + "_div").style.pointerEvents = "all";
                document.getElementById(e + "_alpha").classList.remove("alpha2_locked");
            });
            document.getElementById("time_line_div").style.cursor = "pointer";
        }

        const getPlayListSongUuids = () => {
            if (!currentPlayList) return [];
            if (currentPlayList === "default") return defaultSongs.map(i => i.uuid);
            return []; // TODO: implement playlists
        }

        window.nextSongInPlayList = function nextSongInPlayList() {
            const uuid = sound.uuid;
            const plSongs = getPlayListSongUuids();
            if (plSongs.length === 0) return;
            const index = plSongs.indexOf(uuid);
            if (index === -1) return setSound(0, true);
            if (index >= plSongs.length - 1) return setSound(plSongs[0], true);
            setSound(plSongs[index + 1], true);
        }

        window.previousSongInPlayList = function previousSongInPlayList() {
            const uuid = sound.uuid;
            const plSongs = getPlayListSongUuids();
            if (plSongs.length === 0) return;
            const index = plSongs.indexOf(uuid);
            if (index === -1) return setSound(0, true);
            if (index === 0) return setSound(plSongs[plSongs.length - 1], true);
            setSound(plSongs[index - 1], true);
        }

        window.playRandomSongInPlayList = function playRandomSongInPlayList() {
            const plSongs = getPlayListSongUuids();
            if (plSongs.length === 0) return;
            setSound(plSongs[Math.floor(Math.random() * plSongs.length)], true);
        }

        window.toggleSound = sound.toggle;
        window.playSound = sound.play;
        window.changeLoopType = sound.changeLoopType;
        window.addSoundTime = function addSoundTime(n = 0) {
            if (n === 0 || !sound.hasValidSource()) return;
            sound.setTime(sound.getTime() + n);
        }
        window.changeSpeedType = sound.changeSpeedType;

        sound.setLoopType(sound.NO_LOOP);
        setPage("home");
        setSound(null);

        addEventListener("keydown", ev => {
            if (ev.key === " ") {
                ev.preventDefault();
                sound.toggle();
            }
        });

        const defaultSongs = Object.values(songs).sort((a, b) => a.title === b.title ? 0 : ([a.title, b.title].sort()[0] === b.title ? 1 : -1));

        defaultSongs.forEach((song, j) => {
            document.getElementById("song_table").innerHTML += `
<tr class="song" onclick="setSound('${song.uuid}', true);">
    <td>${j + 1}</td>
    <td class="song_image_td"><img draggable="false" class="song_image" alt="" src="${song.iconFile ? "icons/" + song.iconFile : "icon/blue-icon.png"}"></td>
    <td class="song_title_td">${song.title}</td>
    <td class="song_artist_td">${song.artist}</td>
    <td>${song.date}</td>
    <td>${formatTime(song.time / 1000)}</td>
</tr>`;
        });

        document.addEventListener("contextmenu", ev => ev.preventDefault());
    }
})();