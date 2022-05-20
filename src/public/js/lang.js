window.LanguageManager = {
    container: {
        "tr_TR": {
            "main-menu-left": "Ana Sayfa",
            "search-left": "Ara",
            "library-left": "Kitaplığın",
            "create-playlist-left": "Çalma Listesi Oluştur",
            "favorite-songs-left": "Beğenilen Şarkılar",
            "welcome-text": "Holify'a Hoşgeldiniz",
            "main-menu-rank-table": "#",
            "main-menu-title-table": "Şarkı",
            "main-menu-artist-table": "Sanatçı",
            "main-menu-date-table": "Tarih",
            "main-menu-duration-table": "Süre",
            "no-loop-tooltip": "Döngü yok",
            "loop-tooltip": "Aynı şarkıyı tekrarla",
            "mix-list-tooltip": "Şarkıları karıştır",
            "loop-list-tooltip": "Listedeki şarkıları sırayla çal",
            "song-random-tooltip": "Listedeki rastgele bir şarkıyı oynatır"
        },
        "en_US": {
            "main-menu-left": "Home",
            "search-left": "Search",
            "library-left": "Library",
            "create-playlist-left": "Create Playlist",
            "favorite-songs-left": "Favorite Songs",
            "welcome-text": "Welcome to Holify",
            "main-menu-rank-table": "#",
            "main-menu-title-table": "Song",
            "main-menu-artist-table": "Artist",
            "main-menu-date-table": "Date",
            "main-menu-duration-table": "Duration",
            "no-loop-tooltip": "No loop",
            "loop-tooltip": "Loop current song",
            "mix-list-tooltip": "Mix current playlist",
            "loop-list-tooltip": "Loop current playlist",
            "song-random-tooltip": "Play random song from playlist"
        }
    },
    translateContainer: () => {
        return LanguageManager.container[LanguageManager.get()] || LanguageManager.container["en_US"];
    },
    translate: key => {
        const result = LanguageManager.translateContainer()[key];
        if (!result) console.error(new Error("LanguageManager: Key " + key + " not found"));
        return result || key;
    },
    set: lang => {
        if (!LanguageManager.container[lang]) lang = "en_US";
        localStorage.setItem("lang", lang);
        LanguageManager.refresh();
    },
    get: () => {
        const lang = localStorage.getItem("lang") || LanguageManager.defaultLanguage();
        return LanguageManager.container[lang] ? lang : LanguageManager.defaultLanguage();
    },
    refresh: () => {
        for (const element of document.querySelectorAll("[data-lang]")) {
            const key = element.getAttribute("data-lang");
            element.innerText = LanguageManager.translate(key);
        }
        for (const element of document.querySelectorAll("[data-tooltip-lang]")) {
            const key = element.getAttribute("data-tooltip-lang");
            element.setAttribute("data-tooltip", LanguageManager.translate(key));
        }
    },
    defaultLanguage: () => {
        return navigator.language.replaceAll("-", "_");
    }
};