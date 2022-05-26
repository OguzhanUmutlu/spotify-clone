(async () => {
    window.addEventListener("load", () => {
        const cursorCircle = document.createElement("div");
        const cursor = document.createElement("div");
        cursorCircle.style.display = "none";
        cursorCircle.style.borderRadius = "50%";
        cursorCircle.style.position = "absolute";
        cursorCircle.style.width = "50px";
        cursorCircle.style.height = "50px";
        cursorCircle.style.border = "2px solid rgba(255, 255, 255, 0.5)";
        //cursorCircle.style.backgroundColor = "rgb(255,230,78,.5)";
        cursorCircle.style.pointerEvents = "none";
        document.body.appendChild(cursorCircle);
        cursor.style.display = "none";
        cursor.style.borderRadius = "50%";
        cursor.style.position = "absolute";
        cursor.style.width = "5px";
        cursor.style.height = "5px";
        cursor.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
        cursor.style.pointerEvents = "none";
        document.body.appendChild(cursor);

        let mousePos = [];
        let isMouseIn = false;
        const mouseLegit = {x: 0, y: 0};

        document.addEventListener("mouseleave", () => {
            cursorCircle.style.display = "none";
            cursor.style.display = "none";
            mousePos = [];
            isMouseIn = false;
        });

        addEventListener("mousemove", e => {
            isMouseIn = true;
            mouseLegit.x = e.clientX;
            mouseLegit.y = e.clientY;
            mousePos.push({x: e.pageX, y: e.pageY, t: Date.now()});
            updateCursor();
        });

        setInterval(updateCursor);

        function updateCursor() {
            if (!isMouseIn) return;
            mousePos = mousePos.filter(i => i.t > Date.now() - 100);
            const p = mousePos.sort((a, b) => a.t - b.t)[0] || mouseLegit;
            cursorCircle.style.display = "block";
            //cursorCircle.style.left = `${p.x - 25}px`;
            //cursorCircle.style.top = `${p.y - 25}px`;
            cursorCircle.style.left = `${mouseLegit.x - 25}px`;
            cursorCircle.style.top = `${mouseLegit.y - 25}px`;
            cursor.style.display = "block";
            cursor.style.left = `${mouseLegit.x}px`;
            cursor.style.top = `${mouseLegit.y}px`;
        }
    });
})();