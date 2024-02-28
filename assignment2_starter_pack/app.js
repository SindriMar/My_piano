document.addEventListener("DOMContentLoaded", function() {
    const synth = new Tone.Synth().toDestination();
    let recording = false;
    let recordedTunes = [];
    let createdTunes = {};
    let isTyping = false;

    const play_notes = (note) => {
        synth.triggerAttackRelease(note, "8n");
        if (recording) {
            recordedTunes.push({ note: note, duration: "8n", timing: Date.now() });
        }
    }

    document.querySelectorAll("#keyboardDiv button").forEach(button => {
        button.addEventListener("click", function() {
            if (!isTyping) {
                play_notes(this.id);
            }
        });
    });

    const keyMapping = {
        "a": "c4", "w": "c#4", "s": "d4", "e": "d#4", "d": "e4",
        "f": "f4", "t": "f#4", "g": "g4", "y": "g#4", "h": "a4",
        "u": "bb4", "j": "b4", "k": "c5", "o": "c#5", "l": "d5",
        "p": "d#5", "æ": "e5" 
    };

    document.addEventListener("keydown", function(event) {
        if (!isTyping && keyMapping[event.key]) {
            const keyElement = document.getElementById(keyMapping[event.key]);
            keyElement.style.backgroundColor = "rgb(152, 152, 152)";
            play_notes(keyMapping[event.key]);
        }
    });

    document.addEventListener("keyup", function(event) {
        if (!isTyping && keyMapping[event.key]) {
            const keyElement = document.getElementById(keyMapping[event.key]);
            keyElement.style.backgroundColor = "";
        }
    });

    document.getElementById("recordbtn").addEventListener("click", function() {
        recording = true;
        recordedTunes = [];
        document.getElementById("recordbtn").disabled = true;
        document.getElementById("stopbtn").disabled = false;
    });

    document.getElementById("stopbtn").addEventListener("click", function() {
        recording = false;
        document.getElementById("recordbtn").disabled = false;
        document.getElementById("stopbtn").disabled = true;

        let tuneName = document.getElementById("recordName").value.trim() || "No-name Tune";

        if (recordedTunes.length > 0) {
            createdTunes[tuneName] = recordedTunes;
            add_tune_dropdown(tuneName);

            fetch('http://localhost:3000/api/v1/tunes', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: tuneName, tune: recordedTunes})
            })
            .then(response => response.json())
            .then(data => {
                console.log('Tune saved:', data);
                document.getElementById("recordName").value = "";
            })
            .catch((error) => console.error('Error:', error));
        } else {
            console.log("No tones were played during the recording.");
        }
    });

    const add_tune_dropdown = (tuneName) =>{
        const tuneDropdown = document.getElementById("tunesDrop");
        if (!Array.from(tuneDropdown.options).some(option => option.value === tuneName)) {
            const option = document.createElement("option");
            option.text = tuneName;
            option.value = tuneName;
            tuneDropdown.add(option);
        }
    }

    async function get_tunes() {
        const url = "http://localhost:3000/api/v1/tunes";
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log("Success:", data);
            data.forEach(tune => {
                createdTunes[tune.name] = tune.tune;
                add_tune_dropdown(tune.name);
            });
        } catch (error) {
            console.error("Error:", error);
        }
    }

    get_tunes();

    const chooseTunes = () => {
        console.log("Fetching tunes..");
        const chosenValue = document.getElementById("tunesDrop").value;
        if (createdTunes[chosenValue]) {
            playTune(createdTunes[chosenValue]);
        } else {
            console.log("No tunes found");
        }
    }

    const playTune = (tune) => {
        let time = Tone.now();
        tune.forEach(item => {
            synth.triggerAttackRelease(item.note, item.duration, time);
            time += Tone.Time(item.duration).toSeconds();
        });
    }

    document.getElementById('tunebtn').addEventListener('click', chooseTunes);
});
