const audioContext = new (
    window.AudioContext || window.webkitAudioContext
)();

const soundBuffers = {};
let soundsReady = false;


async function prepareSounds() {
    const button = document.getElementById("prepareButton");

    if (soundsReady) {
        button.textContent = "準備完了！";
        return;
    }

    button.disabled = true;
    button.textContent = "音声を読み込み中…";

    try {
        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        const audioElements = document.querySelectorAll("audio");

        await Promise.all(
            [...audioElements].map(async audio => {
                const sourceElement = audio.querySelector("source");
                const url = audio.currentSrc || sourceElement?.src;

                if (!url || !audio.id) return;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("音声ファイルを読み込めません: " + url);
                }

                const data = await response.arrayBuffer();

                soundBuffers[audio.id] =
                    await audioContext.decodeAudioData(data);
            })
        );

        soundsReady = true;
        button.textContent = "準備完了！";
        button.style.backgroundColor = "#2878d0";

    } catch (error) {
        console.error(error);
        button.disabled = false;
        button.textContent = "失敗しました。もう一度試す";
    }
}

function playsound(note) {
    console.log("押された音:", note);

    if (!soundsReady) {
        console.log("音声の準備がまだできていません");
        return;
    }

    const buffer = soundBuffers[note];

    if (!buffer) {
        console.warn("音声が見つかりません:", note);
        return;
    }

    const playSound = () => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    };

    if (audioContext.state === "suspended") {
        audioContext.resume().then(playSound).catch(console.error);
    } else {
        playSound();
    }
}

document.querySelectorAll(".pan-container .note").forEach(button => {
    button.addEventListener("pointerdown", event => {
        event.preventDefault();

        const note = button.dataset.note;
        if (note) {
            playsound(note);
        }
    });
});